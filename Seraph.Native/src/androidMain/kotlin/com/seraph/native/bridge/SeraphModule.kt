package com.seraph.native.bridge

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ProcessLifecycleOwner
import co.touchlab.kermit.Logger
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.seraph.native.recording.RecordingState
import com.seraph.native.service.ForegroundService
import com.seraph.native.sync.ConnectionState
import com.seraph.native.sync.SyncState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

private val log = Logger.withTag("SeraphModule")

class SeraphModule(
    reactContext: ReactApplicationContext,
    private val dbModule: DbModule,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "SeraphModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var service: ForegroundService? = null
    private val emitters = BridgeEmitters(reactContext)

    private var flowJobs = mutableListOf<Job>()
    private var orchestratorJobs = mutableListOf<Job>()

    fun getService(): ForegroundService? = service

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, b: IBinder) {
            service = (b as ForegroundService.LocalBinder).service
            service!!.uiOpen = true
            service!!.onInAppNotification = { type, payload -> emitters.emitInAppNotification(type, payload) }
            subscribeToFlows()
            log.i { "Bound to ForegroundService" }
        }

        override fun onServiceDisconnected(name: ComponentName) {
            service = null
            log.w { "Unbound from ForegroundService" }
        }
    }

    init {
        reactContext.bindService(
            Intent(reactContext, ForegroundService::class.java),
            connection,
            Context.BIND_AUTO_CREATE,
        )
        Handler(Looper.getMainLooper()).post {
            ProcessLifecycleOwner.get().lifecycle.addObserver(
                LifecycleEventObserver { _, event ->
                    if (event == Lifecycle.Event.ON_STOP) {
                        service?.uiOpen = false
                        service?.shutdownWhenIdle()
                    }
                    if (event == Lifecycle.Event.ON_START) {
                        service?.uiOpen = true
                        service?.syncLoopRunner?.let { it.start(); it.triggerImmediately() }
                        val svc = service
                        if (svc != null && svc.connectionManager.connectionState.value !is ConnectionState.Connected) {
                            val deviceId = reactApplicationContext
                                .getSharedPreferences("seraph_service", Context.MODE_PRIVATE)
                                .getString("device_id", null)
                            if (deviceId != null) {
                                try {
                                    reactApplicationContext.startForegroundService(
                                        Intent(reactApplicationContext, ForegroundService::class.java)
                                            .putExtra(ForegroundService.EXTRA_DEVICE_ID, deviceId),
                                    )
                                } catch (e: Exception) {
                                    log.w { "startForegroundService blocked on resume: ${e.message}" }
                                }
                            }
                        }
                        if (service != null) subscribeToFlows()
                    }
                },
            )
        }
    }

    private fun subscribeToFlows() {
        flowJobs.forEach { it.cancel() }
        flowJobs.clear()
        orchestratorJobs.forEach { it.cancel() }
        orchestratorJobs.clear()

        val cm = service?.connectionManager ?: return
        emitters.emitConnectionState(cm.connectionState.value)
        flowJobs.add(cm.connectionState.onEach { emitters.emitConnectionState(it) }.launchIn(scope))

        fun subscribeToRunners() {
            val svc = service ?: return
            emitters.emitSyncState(svc.syncRunner.state.value)
            orchestratorJobs.add(svc.syncRunner.state.onEach { emitters.emitSyncState(it) }.launchIn(scope))
            orchestratorJobs.add(svc.aggregationCoordinator.state.onEach { emitters.emitSyncState(it) }.launchIn(scope))
            orchestratorJobs.add(svc.syncRunner.deviceEvents.onEach { emitters.emitDeviceEvent(it) }.launchIn(scope))
            orchestratorJobs.add(
                svc.syncRunner.trimAcked.onEach { trim ->
                    emitters.emit("onTrimUpdated", Arguments.createMap().apply { putInt("trimValue", trim) })
                }.launchIn(scope),
            )
            orchestratorJobs.add(
                svc.syncRunner.realtimeHR.onEach { hr ->
                    emitters.emit("onRealtimeHR", Arguments.createMap().apply { putInt("hr", hr) })
                }.launchIn(scope),
            )
            svc.napRunner.onSleepOnset = { startTs -> emitters.emitNapSleepOnset(startTs) }
            svc.recordingManager?.let { rm ->
                orchestratorJobs.add(
                    rm.state.onEach { state ->
                        if (state == RecordingState.AUTO_PAUSED)
                            emitters.emit("onRecordingAutoPaused", Arguments.createMap())
                    }.launchIn(scope),
                )
            }
            orchestratorJobs.add(
                svc.syncRunner.state.onEach { state ->
                    if (state is SyncState.Complete) {
                        dbModule.onSyncComplete(state)
                        emitters.emit("onWorkoutProcessed", Arguments.createMap().apply {
                            state.closedActivityStartTs.firstOrNull()?.let { putDouble("activityId", it.toDouble()) }
                        })
                    }
                }.launchIn(scope),
            )
            svc.syncLoopRunner.start()
            svc.syncLoopRunner.triggerImmediately()
        }

        if (cm.connectionState.value is ConnectionState.Connected) subscribeToRunners()

        flowJobs.add(
            cm.connectionState.onEach { state ->
                if (state is ConnectionState.Connected) subscribeToRunners()
            }.launchIn(scope),
        )
    }

    override fun onCatalystInstanceDestroy() {
        scope.cancel()
        super.onCatalystInstanceDestroy()
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
