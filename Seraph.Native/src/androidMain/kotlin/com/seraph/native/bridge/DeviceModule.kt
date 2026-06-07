package com.seraph.native.bridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.seraph.native.service.ForegroundService
import com.seraph.native.sync.Device
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class DeviceModule(
    reactContext: ReactApplicationContext,
    private val serviceProvider: () -> ForegroundService?,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "DeviceModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private fun device(
        promise: Promise,
        block: suspend (Device) -> Unit,
    ) {
        scope.launch {
            val dev =
                serviceProvider()?.connectionManager?.device
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

    private fun cachedDeviceCall(
        promise: Promise,
        fetch: suspend (Device) -> WritableMap?,
        fallback: suspend () -> WritableMap?,
    ) {
        scope.launch {
            try {
                val dev = serviceProvider()?.connectionManager?.device
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

    @ReactMethod
    fun getBattery(promise: Promise) =
        cachedDeviceCall(
            promise,
            fetch = { dev ->
                val info = dev.getBattery() ?: return@cachedDeviceCall null
                serviceProvider()?.syncRunner?.cachedBattery = info.level.toDouble()
                Arguments.createMap().apply {
                    putDouble("level", info.level.toDouble())
                    putInt("rawValue", info.rawValue)
                }
            },
            fallback = {
                val cached = serviceProvider()?.syncRunner?.cachedBattery ?: return@cachedDeviceCall null
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
                serviceProvider()?.syncRunner?.cachedOnWrist = info.onWrist
                serviceProvider()?.syncRunner?.cachedCharging = info.charging
                Arguments.createMap().apply {
                    putBoolean("onWrist", info.onWrist)
                    putBoolean("charging", info.charging)
                }
            },
            fallback = {
                val onWrist = serviceProvider()?.syncRunner?.cachedOnWrist ?: return@cachedDeviceCall null
                val charging = serviceProvider()?.syncRunner?.cachedCharging ?: return@cachedDeviceCall null
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
                serviceProvider()?.saveVersionToDb(info.harvard, info.boylston)
                Arguments.createMap().apply {
                    putString("harvard", info.harvard)
                    putString("boylston", info.boylston)
                }
            },
            fallback = {
                val (harvard, boylston) = serviceProvider()?.readVersionFromDb() ?: Pair(null, null)
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
            val runner = serviceProvider()?.syncRunner
            try {
                val dev = serviceProvider()?.connectionManager?.device
                if (dev != null) {
                    val sec = dev.getAlarm()
                    runner?.cachedAlarm = sec
                    promise.resolve(if (sec == null || sec == 0) null else sec.toDouble())
                    return@launch
                }
                val cached = runner?.cachedAlarm
                promise.resolve(if (cached == null || cached == 0) null else cached.toDouble())
            } catch (e: Exception) {
                val cached = runner?.cachedAlarm
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

    @ReactMethod
    fun scan(promise: Promise) {
        scope.launch {
            try {
                val cm =
                    serviceProvider()?.connectionManager
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
                serviceProvider()?.connectionManager?.stopScan()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("STOP_SCAN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
