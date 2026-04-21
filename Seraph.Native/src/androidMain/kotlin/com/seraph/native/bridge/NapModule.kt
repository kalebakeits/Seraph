package com.seraph.native.bridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.seraph.native.db.DbHolder
import com.seraph.native.service.ForegroundService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class NapModule(
    reactContext: ReactApplicationContext,
    private val serviceProvider: () -> ForegroundService?,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "NapModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private suspend fun awaitService(timeoutMs: Long = 5_000L): ForegroundService? {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (serviceProvider() == null && System.currentTimeMillis() < deadline) delay(50)
        return serviceProvider()
    }

    @ReactMethod
    fun startNap(promise: Promise) {
        scope.launch {
            try {
                val svc = awaitService()
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                svc.napRunner.start(svc.syncRunner.device)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("NAP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun cancelNap(promise: Promise) {
        scope.launch {
            try {
                awaitService()
                    ?: run { promise.reject("SERVICE_NOT_READY", "Service not started"); return@launch }
                serviceProvider()?.napRunner?.cancel()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("NAP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getNapState(promise: Promise) {
        scope.launch {
            try {
                val db = DbHolder.db
                val mode = db.seraphDbQueries.getAppParameter("nap_mode").executeAsOneOrNull()
                val active = !mode.isNullOrEmpty()
                val targetMs = db.seraphDbQueries.getAppParameter("nap_active_duration_ms").executeAsOneOrNull()?.toLongOrNull()
                val cutoffSec = db.seraphDbQueries.getAppParameter("nap_hard_cutoff_sec").executeAsOneOrNull()?.toLongOrNull()
                val today = java.time.LocalDate.now().toString()
                val napStartTs = db.seraphDbQueries.getOpenNapSleep(today).executeAsList().firstOrNull()?.start_ts
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("active", active)
                    if (targetMs != null) putDouble("targetMs", targetMs.toDouble()) else putNull("targetMs")
                    if (cutoffSec != null) putDouble("hardCutoffSec", cutoffSec.toDouble()) else putNull("hardCutoffSec")
                    if (mode != null && mode.isNotEmpty()) putString("mode", mode) else putNull("mode")
                    if (napStartTs != null) putDouble("sleepStartTs", napStartTs.toDouble()) else putNull("sleepStartTs")
                })
            } catch (e: Exception) {
                promise.reject("NAP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
