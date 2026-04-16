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
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.seraph.native.aggregation.OverlapException
import com.seraph.native.db.DbHolder
import com.seraph.native.db.DbKeyExport
import com.seraph.native.recording.RecordingManager
import com.seraph.native.recording.RecordingState
import com.seraph.native.service.AlarmReceiver
import com.seraph.native.service.ForegroundService
import com.seraph.native.sync.ConnectionState
import com.seraph.native.sync.Device
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
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "SeraphModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var service: ForegroundService? = null
    private val emitters = BridgeEmitters(reactContext)

    private var flowJobs = mutableListOf<Job>()
    private var orchestratorJobs = mutableListOf<Job>()

    private suspend fun awaitService(timeoutMs: Long = 5_000L): ForegroundService? {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (service == null && System.currentTimeMillis() < deadline) {
            delay(50)
        }
        return service
    }

    private val connection =
        object : ServiceConnection {
            override fun onServiceConnected(
                name: ComponentName,
                b: IBinder,
            ) {
                service = (b as ForegroundService.LocalBinder).service
                service!!.uiOpen = true
                service!!.onInAppNotification = { type, payload ->
                    emitters.emitInAppNotification(type, payload)
                }
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
            ProcessLifecycleOwner
                .get()
                .lifecycle
                .addObserver(
                    LifecycleEventObserver { _, event ->
                        if (event == Lifecycle.Event.ON_STOP) {
                            service?.uiOpen = false
                            service?.shutdownWhenIdle()
                        }
                        if (event == Lifecycle.Event.ON_START) {
                            service?.uiOpen = true
                            service?.orchestrator?.let {
                                it.startSyncLoop()
                                it.triggerImmediately()
                            }
                            val svc = service
                            if (svc != null &&
                                svc.connectionManager.connectionState.value !is ConnectionState.Connected
                            ) {
                                val deviceId =
                                    reactApplicationContext
                                        .getSharedPreferences("seraph_service", Context.MODE_PRIVATE)
                                        .getString("device_id", null)
                                if (deviceId != null) {
                                    try {
                                        reactApplicationContext.startForegroundService(
                                            Intent(reactApplicationContext, ForegroundService::class.java)
                                                .putExtra(ForegroundService.EXTRA_DEVICE_ID, deviceId),
                                        )
                                    } catch (e: Exception) {
                                        log.w {
                                            "startForegroundService blocked on resume (Android 12+ restriction) — JS connect() will retry: ${e.message}"
                                        }
                                    }
                                }
                            }
                            if (service != null) subscribeToFlows()
                        }
                    },
                )
        }
    }

    // ── Flow subscriptions ────────────────────────────────────────────────────

    private fun subscribeToFlows() {
        flowJobs.forEach { it.cancel() }
        flowJobs.clear()
        orchestratorJobs.forEach { it.cancel() }
        orchestratorJobs.clear()

        val cm = service?.connectionManager ?: return

        // Emit current connection state immediately, then subscribe to changes
        emitters.emitConnectionState(cm.connectionState.value)

        flowJobs.add(cm.connectionState.onEach { emitters.emitConnectionState(it) }.launchIn(scope))

        // Helper to subscribe to orchestrator flows
        fun subscribeToOrchestrator(orc: com.seraph.native.sync.WorkOrchestrator) {
            // Emit current orchestrator state immediately
            emitters.emitSyncState(orc.state.value)

            orchestratorJobs.add(
                orc.state
                    .onEach { emitters.emitSyncState(it) }
                    .launchIn(scope),
            )
            orchestratorJobs.add(
                orc.deviceEvents
                    .onEach { emitters.emitDeviceEvent(it) }
                    .launchIn(scope),
            )
            orchestratorJobs.add(
                orc.trimAcked
                    .onEach { trim ->
                        emitters.emit(
                            "onTrimUpdated",
                            Arguments.createMap().apply {
                                putInt("trimValue", trim)
                            },
                        )
                    }.launchIn(scope),
            )
            orchestratorJobs.add(
                orc.realtimeHR
                    .onEach { hr ->
                        emitters.emit(
                            "onRealtimeHR",
                            Arguments.createMap().apply {
                                putInt("hr", hr)
                            },
                        )
                    }.launchIn(scope),
            )
            orc.startSyncLoop()
            orc.triggerImmediately()
        }

        // Subscribe to orchestrator if already connected
        if (cm.connectionState.value is ConnectionState.Connected) {
            service?.orchestrator?.let { subscribeToOrchestrator(it) }
        }

        flowJobs.add(
            cm.connectionState
                .onEach { state ->
                    when (state) {
                        is ConnectionState.Connected ->
                            service?.orchestrator?.let { subscribeToOrchestrator(it) }
                        is ConnectionState.Disconnected, is ConnectionState.Error -> {}

                        else -> {}
                    }
                }.launchIn(scope),
        )
    }

    // ── Deep link ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun getInitialDeepLink(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        val url = activity?.intent?.getStringExtra("deepLink")
        activity?.intent?.removeExtra("deepLink")
        promise.resolve(url)
    }

    // ── Scanning ──────────────────────────────────────────────────────────────

    @ReactMethod
    fun scan(promise: Promise) {
        scope.launch {
            try {
                val cm =
                    service?.connectionManager
                        ?: run {
                            promise.reject("NOT_BOUND", "Service not bound")
                            return@launch
                        }
                val results = cm.scan()
                promise.resolve(
                    Arguments.createArray().also { arr ->
                        results.forEach { d ->
                            arr.pushMap(
                                Arguments.createMap().apply {
                                    putString("id", d.address)
                                    putString("name", d.name)
                                    putInt("rssi", d.rssi)
                                },
                            )
                        }
                    },
                )
            } catch (e: Exception) {
                promise.reject("SCAN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        scope.launch {
            try {
                service?.connectionManager?.stopScan()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("STOP_SCAN_ERROR", e.message, e)
            }
        }
    }

    // ── Connection ────────────────────────────────────────────────────────────

    @ReactMethod
    fun connect(
        deviceId: String,
        promise: Promise,
    ) {
        reactApplicationContext
            .getSharedPreferences("seraph_service", Context.MODE_PRIVATE)
            .edit()
            .putString("device_id", deviceId)
            .apply()
        reactApplicationContext.startForegroundService(
            Intent(reactApplicationContext, ForegroundService::class.java)
                .putExtra(ForegroundService.EXTRA_DEVICE_ID, deviceId),
        )
        AlarmReceiver.schedule(reactApplicationContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        scope.launch {
            try {
                service?.connectionManager?.disconnect()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DISCONNECT_ERROR", e.message, e)
            }
        }
    }

    // ── Sync ──────────────────────────────────────────────────────────────────

    @ReactMethod
    fun syncNow(
        options: ReadableMap?,
        promise: Promise,
    ) {
        scope.launch {
            try {
                val orc =
                    service?.orchestrator
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                val trim =
                    if (options?.hasKey("lastTrim") == true && !options.isNull("lastTrim")) {
                        options.getInt("lastTrim")
                    } else {
                        null
                    }
                orc.requestSync(trim)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("SYNC_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun abortSync(promise: Promise) {
        scope.launch {
            try {
                service?.orchestrator?.abortSync()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ABORT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun forceTrim(
        trimValue: Int,
        promise: Promise,
    ) {
        scope.launch {
            try {
                val orc =
                    service?.orchestrator
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                orc.forceTrim(trimValue)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("FORCE_TRIM_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getLastTrim(promise: Promise) {
        scope.launch {
            try {
                val orc =
                    service?.orchestrator
                        ?: run {
                            promise.resolve(null)
                            return@launch
                        }
                val (trimVal, savedAt, r24Ts) = orc.getLastTrim()
                if (trimVal == null) {
                    promise.resolve(null)
                } else {
                    promise.resolve(
                        Arguments.createMap().apply {
                            putInt("trimValue", trimVal)
                            savedAt?.let { putDouble("savedAt", it.toDouble()) }
                            r24Ts?.let { putDouble("r24Timestamp", it.toDouble()) }
                        },
                    )
                }
            } catch (e: Exception) {
                promise.reject("GET_LAST_TRIM_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun reaggregate(
        datesArray: ReadableArray,
        promise: Promise,
    ) {
        scope.launch {
            try {
                val orc =
                    service?.orchestrator
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                val dates = (0 until datesArray.size()).mapNotNull { datesArray.getString(it) }
                orc.reaggregate(dates)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("REAGGREGATE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun recalcActivity(
        activityId: Double,
        promise: Promise,
    ) {
        scope.launch(Dispatchers.IO) {
            try {
                val orc =
                    awaitService()?.orchestrator
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                orc.recalcActivity(activityId.toLong())
                promise.resolve(null)
            } catch (e: OverlapException) {
                promise.reject("OVERLAP_ACTIVITY", e.message, e)
            } catch (e: Exception) {
                promise.reject("RECALC_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun refreshDailyLoad(
        date: String,
        promise: Promise,
    ) {
        scope.launch(Dispatchers.IO) {
            try {
                val orc =
                    awaitService()?.orchestrator
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                orc.refreshDailyLoad(date)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("REFRESH_LOAD_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun recalcSleep(
        sleepId: Double,
        promise: Promise,
    ) {
        scope.launch(Dispatchers.IO) {
            try {
                val orc =
                    awaitService()?.orchestrator
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                orc.recalcSleep(sleepId.toLong())
                promise.resolve(null)
            } catch (e: OverlapException) {
                promise.reject("OVERLAP_SLEEP", e.message, e)
            } catch (e: Exception) {
                promise.reject("RECALC_ERROR", e.message, e)
            }
        }
    }

    // ── Device commands ───────────────────────────────────────────────────────

    private fun device(
        promise: Promise,
        block: suspend (Device) -> Unit,
    ) {
        scope.launch {
            val dev =
                service?.connectionManager?.device
                    ?: run {
                        promise.reject("NOT_CONNECTED", "Not connected")
                        return@launch
                    }
            try {
                block(dev)
            } catch (e: Exception) {
                promise.reject("CMD_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getBattery(promise: Promise) =
        cachedDeviceCall(
            promise,
            fetch = { dev ->
                val info = dev.getBattery() ?: return@cachedDeviceCall null
                service?.orchestrator?.cachedBattery = info.level.toDouble()
                Arguments.createMap().apply {
                    putDouble("level", info.level.toDouble())
                    putInt("rawValue", info.rawValue)
                }
            },
            fallback = {
                val cached = service?.orchestrator?.cachedBattery ?: return@cachedDeviceCall null
                Arguments.createMap().apply {
                    putDouble("level", cached)
                    putInt("rawValue", 0)
                }
            },
        )

    @ReactMethod
    fun getHello(promise: Promise) =
        cachedDeviceCall(
            promise,
            fetch = { dev ->
                val info = dev.getHello() ?: return@cachedDeviceCall null
                service?.orchestrator?.cachedOnWrist = info.onWrist
                service?.orchestrator?.cachedCharging = info.charging
                Arguments.createMap().apply {
                    putBoolean("onWrist", info.onWrist)
                    putBoolean("charging", info.charging)
                }
            },
            fallback = {
                val onWrist = service?.orchestrator?.cachedOnWrist ?: return@cachedDeviceCall null
                val charging = service?.orchestrator?.cachedCharging ?: return@cachedDeviceCall null
                Arguments.createMap().apply {
                    putBoolean("onWrist", onWrist)
                    putBoolean("charging", charging)
                }
            },
        )

    @ReactMethod
    fun getVersion(promise: Promise) =
        cachedDeviceCall(
            promise,
            fetch = { dev ->
                val info = dev.getVersion() ?: return@cachedDeviceCall null
                service?.saveVersionToDb(info.harvard, info.boylston)
                Arguments.createMap().apply {
                    putString("harvard", info.harvard)
                    putString("boylston", info.boylston)
                }
            },
            fallback = {
                val (harvard, boylston) = service?.readVersionFromDb() ?: Pair(null, null)
                if (harvard != null && boylston != null) {
                    Arguments.createMap().apply {
                        putString("harvard", harvard)
                        putString("boylston", boylston)
                    }
                } else {
                    null
                }
            },
        )

    @ReactMethod
    fun getAlarm(promise: Promise) {
        scope.launch {
            val orc = service?.orchestrator
            try {
                val dev = service?.connectionManager?.device
                if (dev != null) {
                    val sec = dev.getAlarm()
                    orc?.cachedAlarm = sec
                    promise.resolve(if (sec == null || sec == 0) null else sec.toDouble())
                    return@launch
                }
                val cached = orc?.cachedAlarm
                promise.resolve(if (cached == null || cached == 0) null else cached.toDouble())
            } catch (e: Exception) {
                val cached = orc?.cachedAlarm
                if (cached != null) {
                    promise.resolve(if (cached == 0) null else cached.toDouble())
                } else {
                    promise.reject("CMD_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod fun getClock(promise: Promise) =
        device(promise) { dev ->
            val sec =
                dev.getClock() ?: run {
                    promise.reject("CMD_ERROR", "No response")
                    return@device
                }
            promise.resolve(sec.toDouble())
        }

    @ReactMethod fun setClock(
        unixSec: Double,
        promise: Promise,
    ) = device(promise) { dev ->
        dev.setClock(unixSec.toInt())
        promise.resolve(null)
    }

    @ReactMethod fun setAlarm(
        unixSec: Double,
        promise: Promise,
    ) = device(promise) { dev ->
        dev.setAlarm(unixSec.toInt())
        promise.resolve(null)
    }

    @ReactMethod fun disableAlarm(promise: Promise) =
        device(promise) { dev ->
            dev.disableAlarm()
            promise.resolve(null)
        }

    @ReactMethod fun vibrate(promise: Promise) =
        device(promise) { dev ->
            dev.vibrate()
            promise.resolve(null)
        }

    @ReactMethod fun haptic(promise: Promise) =
        device(promise) { dev ->
            dev.haptic()
            promise.resolve(null)
        }

    @ReactMethod fun reboot(promise: Promise) =
        device(promise) { dev ->
            dev.reboot()
            promise.resolve(null)
        }

    @ReactMethod fun eraseAllData(promise: Promise) =
        device(promise) { dev ->
            dev.eraseAllData()
            promise.resolve(null)
        }

    @ReactMethod fun toggleRealtimeHR(
        enable: Boolean,
        promise: Promise,
    ) = device(promise) { dev ->
        dev.toggleRealtimeHR(enable)
        promise.resolve(null)
    }

    /**
     * Generic pattern for device commands that fall back to an in-memory/DB cache on failure.
     * [fetch] tries the live BLE call; [fallback] returns cached data. Both return null to signal "no data".
     */
    private fun cachedDeviceCall(
        promise: Promise,
        fetch: suspend (Device) -> com.facebook.react.bridge.WritableMap?,
        fallback: suspend () -> com.facebook.react.bridge.WritableMap?,
    ) {
        scope.launch {
            try {
                val dev = service?.connectionManager?.device
                if (dev != null) {
                    val result = fetch(dev)
                    if (result != null) {
                        promise.resolve(result)
                        return@launch
                    }
                }
                val cached = fallback()
                if (cached != null) {
                    promise.resolve(cached)
                } else {
                    promise.reject("CMD_ERROR", "No response and no cached value")
                }
            } catch (e: Exception) {
                val cached = fallback()
                if (cached != null) {
                    promise.resolve(cached)
                } else {
                    promise.reject("CMD_ERROR", e.message, e)
                }
            }
        }
    }

    // ── Workout Recording ─────────────────────────────────────────────────────

    private fun recordingManager(promise: Promise): RecordingManager? {
        val rm = service?.recordingManager
        if (rm == null) promise.reject("SERVICE_NOT_READY", "Service not started")
        return rm
    }

    @ReactMethod
    fun startWorkoutRecording(
        sportLabel: String,
        promise: Promise,
    ) {
        scope.launch {
            try {
                val rm = recordingManager(promise) ?: return@launch
                val orc =
                    service?.orchestrator ?: run {
                        promise.reject("SERVICE_NOT_READY", "Orchestrator not ready")
                        return@launch
                    }
                orc.startRecording(rm, sportLabel)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun pauseWorkoutRecording(promise: Promise) {
        scope.launch {
            try {
                val rm = recordingManager(promise) ?: return@launch
                rm.pause()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun resumeWorkoutRecording(promise: Promise) {
        scope.launch {
            try {
                val rm = recordingManager(promise) ?: return@launch
                rm.resume()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopWorkoutRecording(promise: Promise) {
        scope.launch {
            try {
                val rm = recordingManager(promise) ?: return@launch
                val orc =
                    service?.orchestrator ?: run {
                        promise.reject("SERVICE_NOT_READY", "Orchestrator not ready")
                        return@launch
                    }
                val result = orc.stopRecording(rm)
                if (result == null) {
                    promise.reject("NO_DATA", "No HR data captured")
                    return@launch
                }
                promise.resolve(
                    Arguments.createMap().apply {
                        putDouble("activityId", result.activityId.toDouble())
                        putString("date", result.date)
                        putDouble("durationMs", result.durationMs.toDouble())
                    },
                )
                emitters.emit(
                    "onWorkoutProcessed",
                    Arguments.createMap().apply {
                        putDouble("activityId", result.activityId.toDouble())
                        putString("date", result.date)
                    },
                )
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun discardWorkoutRecording(promise: Promise) {
        scope.launch {
            try {
                val rm = recordingManager(promise) ?: return@launch
                val orc =
                    service?.orchestrator ?: run {
                        rm.discard()
                        promise.resolve(null)
                        return@launch
                    }
                orc.discardRecording(rm)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getRecordingState(promise: Promise) {
        scope.launch {
            try {
                val rm = service?.recordingManager
                if (rm == null) {
                    promise.resolve(Arguments.createMap().apply { putString("state", "idle") })
                    return@launch
                }
                val stateStr =
                    when (rm.state.value) {
                        RecordingState.IDLE -> "idle"
                        RecordingState.RECORDING -> "recording"
                        RecordingState.PAUSED -> "paused"
                    }
                promise.resolve(
                    Arguments.createMap().apply {
                        putString("state", stateStr)
                        putDouble("elapsedMs", rm.getElapsedMs().toDouble())
                        val hr = rm.getCurrentHr()
                        if (hr != null) putInt("currentHr", hr) else putNull("currentHr")
                    },
                )
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    // ── Dev tools ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun getDbPath(promise: Promise) {
        promise.resolve(ForegroundService.dbPath(reactApplicationContext))
    }

    @ReactMethod
    fun getDbKey(promise: Promise) {
        try {
            promise.resolve(DbKeyExport.getHex(reactApplicationContext))
        } catch (e: Exception) {
            promise.reject("FORBIDDEN", e.message)
        }
    }

    @ReactMethod
    fun exportDb(promise: Promise) {
        scope.launch(Dispatchers.IO) {
            try {
                val src = java.io.File(ForegroundService.dbPath(reactApplicationContext))
                val downloads =
                    android.os.Environment.getExternalStoragePublicDirectory(
                        android.os.Environment.DIRECTORY_DOWNLOADS,
                    )
                downloads.mkdirs()
                val ts =
                    java.text
                        .SimpleDateFormat("yyyyMMdd_HHmmss", java.util.Locale.US)
                        .format(java.util.Date())
                val dst = java.io.File(downloads, "seraph_$ts.db")
                src.copyTo(dst, overwrite = true)
                promise.resolve(dst.absolutePath)
            } catch (e: Exception) {
                promise.reject("EXPORT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun listExportedDbs(promise: Promise) {
        scope.launch(Dispatchers.IO) {
            try {
                val downloads =
                    android.os.Environment.getExternalStoragePublicDirectory(
                        android.os.Environment.DIRECTORY_DOWNLOADS,
                    )
                val files =
                    downloads.listFiles { f ->
                        f.name.startsWith("seraph_") && f.name.endsWith(".db")
                    } ?: emptyArray()
                files.sortByDescending { it.lastModified() }
                val arr = Arguments.createArray()
                files.forEach { arr.pushString(it.absolutePath) }
                promise.resolve(arr)
            } catch (e: Exception) {
                promise.reject("LIST_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun importDb(
        srcPath: String,
        dstPath: String,
        promise: Promise,
    ) {
        scope.launch(Dispatchers.IO) {
            try {
                service?.orchestrator?.abortSync()
                val src = java.io.File(srcPath)
                if (!src.exists()) {
                    promise.reject("IMPORT_ERROR", "File not found: $srcPath")
                    return@launch
                }
                val dst = java.io.File(dstPath)
                dst.parentFile?.mkdirs()
                src.copyTo(dst, overwrite = true)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("IMPORT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun restartApp(promise: Promise) {
        scope.launch(Dispatchers.Main) {
            try {
                reactApplicationContext.stopService(
                    Intent(reactApplicationContext, ForegroundService::class.java),
                )
                promise.resolve(null)
            } catch (_: Exception) {
                promise.resolve(null)
            } finally {
                Handler(Looper.getMainLooper()).postDelayed({
                    android.os.Process.killProcess(android.os.Process.myPid())
                }, 300)
            }
        }
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    @ReactMethod
    fun getUnreadNotificationCount(promise: Promise) {
        scope.launch {
            try {
                val db = DbHolder.db
                val count = db.seraphDbQueries.getUnreadNotificationCount().executeAsOne()
                promise.resolve(count.toInt())
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun markNotificationRead(
        id: Double,
        promise: Promise,
    ) {
        scope.launch {
            try {
                DbHolder.db.seraphDbQueries.markNotificationRead(id.toLong())
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun markAllNotificationsRead(promise: Promise) {
        scope.launch {
            try {
                DbHolder.db.seraphDbQueries.markAllNotificationsRead()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    // ── Blob upload config ────────────────────────────────────────────────────

    @ReactMethod
    fun isBlobUploadAvailable(promise: Promise) {
        promise.resolve(service?.isBlobUploadAvailable ?: false)
    }

    @ReactMethod
    fun getBlobUploadConfig(promise: Promise) {
        try {
            val clazz = Class.forName("com.seraph.native.blob.BlobUploader")
            val method = clazz.getMethod("getConfig", android.content.Context::class.java)

            @Suppress("UNCHECKED_CAST")
            val pair = method.invoke(clazz.kotlin.objectInstance, reactApplicationContext) as Pair<String, String>
            val (url, token) = pair
            val map =
                Arguments.createMap().apply {
                    putString("uploadUrl", url)
                    putString("bearerToken", token)
                }
            promise.resolve(map)
        } catch (e: ClassNotFoundException) {
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("BLOB_CONFIG_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setBlobUploadConfig(
        uploadUrl: String,
        bearerToken: String,
        promise: Promise,
    ) {
        try {
            val clazz = Class.forName("com.seraph.native.blob.BlobUploader")
            val method = clazz.getMethod("saveConfig", android.content.Context::class.java, String::class.java, String::class.java)
            method.invoke(clazz.kotlin.objectInstance, reactApplicationContext, uploadUrl, bearerToken)
            promise.resolve(null)
        } catch (e: ClassNotFoundException) {
            promise.reject("UNAVAILABLE", "Blob upload not available in this build")
        } catch (e: Exception) {
            promise.reject("BLOB_CONFIG_ERROR", e.message, e)
        }
    }

    // ── RN boilerplate ────────────────────────────────────────────────────────

    @ReactMethod fun addListener(eventName: String) {}

    @ReactMethod fun removeListeners(count: Int) {}
}
