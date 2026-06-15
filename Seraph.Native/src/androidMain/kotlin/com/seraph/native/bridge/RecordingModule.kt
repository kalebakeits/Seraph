package com.seraph.native.bridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.seraph.native.recording.RecordingState
import com.seraph.native.service.ForegroundService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class RecordingModule(
    reactContext: ReactApplicationContext,
    private val serviceProvider: () -> ForegroundService?,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "RecordingModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    @ReactMethod
    fun startWorkoutRecording(
        sportLabel: String,
        promise: Promise,
    ) {
        scope.launch {
            try {
                val rr =
                    serviceProvider()?.recordingRunner
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                rr.start(sportLabel)
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
                serviceProvider()?.recordingManager?.pause()
                    ?: run {
                        promise.reject("SERVICE_NOT_READY", "Service not started")
                        return@launch
                    }
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
                serviceProvider()?.recordingManager?.resume()
                    ?: run {
                        promise.reject("SERVICE_NOT_READY", "Service not started")
                        return@launch
                    }
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
                val rr =
                    serviceProvider()?.recordingRunner
                        ?: run {
                            promise.reject("SERVICE_NOT_READY", "Service not started")
                            return@launch
                        }
                val result = rr.stop()
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
            } catch (e: Exception) {
                promise.reject("RECORDING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun discardWorkoutRecording(promise: Promise) {
        scope.launch {
            try {
                serviceProvider()?.recordingRunner?.discard()
                    ?: run {
                        promise.reject("SERVICE_NOT_READY", "Service not started")
                        return@launch
                    }
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
                val rm = serviceProvider()?.recordingManager
                if (rm == null) {
                    promise.resolve(Arguments.createMap().apply { putString("state", "idle") })
                    return@launch
                }
                val stateStr =
                    when (rm.state.value) {
                        RecordingState.IDLE -> "idle"
                        RecordingState.RECORDING -> "recording"
                        RecordingState.PAUSED -> "paused"
                        RecordingState.AUTO_PAUSED -> "auto_paused"
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

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
