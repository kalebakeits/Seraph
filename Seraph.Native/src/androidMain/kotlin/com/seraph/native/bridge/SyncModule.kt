package com.seraph.native.bridge

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.seraph.native.aggregation.OverlapException
import com.seraph.native.service.AlarmReceiver
import com.seraph.native.service.ForegroundService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class SyncModule(
    reactContext: ReactApplicationContext,
    private val serviceProvider: () -> ForegroundService?,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "SyncModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private suspend fun awaitService(timeoutMs: Long = 5_000L): ForegroundService? {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (serviceProvider() == null && System.currentTimeMillis() < deadline) delay(50)
        return serviceProvider()
    }

    @ReactMethod
    fun connect(deviceId: String, promise: Promise) {
        reactApplicationContext
            .getSharedPreferences("seraph_service", Context.MODE_PRIVATE)
            .edit().putString("device_id", deviceId).apply()
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
                serviceProvider()?.connectionManager?.disconnect()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DISCONNECT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun syncNow(options: ReadableMap?, promise: Promise) {
        scope.launch {
            try {
                val runner = serviceProvider()?.syncRunner
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                val trim = if (options?.hasKey("lastTrim") == true && !options.isNull("lastTrim"))
                    options.getInt("lastTrim") else null
                runner.requestSync(trim)
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
                serviceProvider()?.syncRunner?.abortSync()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ABORT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun forceTrim(trimValue: Int, promise: Promise) {
        scope.launch {
            try {
                val runner = serviceProvider()?.syncRunner
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                runner.forceTrim(trimValue)
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
                val runner = serviceProvider()?.syncRunner
                    ?: run { promise.resolve(null); return@launch }
                val (trimVal, savedAt, r24Ts) = runner.getLastTrim()
                if (trimVal == null) {
                    promise.resolve(null)
                } else {
                    promise.resolve(com.facebook.react.bridge.Arguments.createMap().apply {
                        putInt("trimValue", trimVal)
                        savedAt?.let { putDouble("savedAt", it.toDouble()) }
                        r24Ts?.let { putDouble("r24Timestamp", it.toDouble()) }
                    })
                }
            } catch (e: Exception) {
                promise.reject("GET_LAST_TRIM_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun reaggregate(datesArray: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                val coordinator = serviceProvider()?.aggregationCoordinator
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                val dates = (0 until datesArray.size()).mapNotNull { datesArray.getString(it) }
                coordinator.reaggregate(dates)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("REAGGREGATE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun recalcActivity(activityId: Double, promise: Promise) {
        scope.launch(Dispatchers.IO) {
            try {
                val coordinator = awaitService()?.aggregationCoordinator
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                coordinator.recalcActivity(activityId.toLong())
                promise.resolve(null)
            } catch (e: OverlapException) {
                promise.reject("OVERLAP_ACTIVITY", e.message, e)
            } catch (e: Exception) {
                promise.reject("RECALC_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun recalcSleep(sleepId: Double, promise: Promise) {
        scope.launch(Dispatchers.IO) {
            try {
                val coordinator = awaitService()?.aggregationCoordinator
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                coordinator.recalcSleep(sleepId.toLong())
                promise.resolve(null)
            } catch (e: OverlapException) {
                promise.reject("OVERLAP_SLEEP", e.message, e)
            } catch (e: Exception) {
                promise.reject("RECALC_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun refreshDailyLoad(date: String, promise: Promise) {
        scope.launch(Dispatchers.IO) {
            try {
                val coordinator = awaitService()?.aggregationCoordinator
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                coordinator.refreshDailyLoad(date)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("REFRESH_LOAD_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getInitialDeepLink(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        val url = activity?.intent?.getStringExtra("deepLink")
        activity?.intent?.removeExtra("deepLink")
        promise.resolve(url)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
