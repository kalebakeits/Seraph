package com.seraph.native.bridge

import co.touchlab.kermit.Logger
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.seraph.native.parsers.events.StrapCondition
import com.seraph.native.parsers.events.StrapConditionReportHandler
import com.seraph.native.protocol.EventNumber
import com.seraph.native.sync.ConnectionState
import com.seraph.native.sync.DeviceEvent
import com.seraph.native.sync.SyncState

private val log = Logger.withTag("BridgeEmitters")

/**
 * Encapsulates all RN event emission logic.
 * SeraphModule delegates here to keep the bridge class focused on @ReactMethod routing.
 */
internal class BridgeEmitters(
    private val reactContext: ReactApplicationContext,
) {
    val strapConditionParser = StrapConditionReportHandler()

    fun emit(
        eventName: String,
        params: WritableMap,
    ) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    fun emitConnectionState(state: ConnectionState) {
        emit(
            "onSyncStateChange",
            Arguments.createMap().apply {
                when (state) {
                    is ConnectionState.Connecting -> putString("status", "connecting")
                    is ConnectionState.Connected -> putString("status", "connected")
                    is ConnectionState.Disconnected -> putString("status", "disconnected")
                    is ConnectionState.Error -> {
                        putString("status", "error")
                        putString("message", state.message)
                    }
                }
            },
        )
    }

    fun emitSyncState(state: SyncState) {
        emit(
            "onSyncStateChange",
            Arguments.createMap().apply {
                when (state) {
                    is SyncState.Idle -> putString("status", "idle")
                    is SyncState.Syncing -> {
                        putString("status", "syncing")
                        putInt("packetsReceived", state.packetsReceived)
                        state.latestDate?.let { putString("latestDate", it) }
                    }
                    is SyncState.Aggregating -> putString("status", "aggregating")
                    is SyncState.AggregatingDate -> {
                        putString("status", "aggregating")
                        putString("date", state.date)
                    }
                    is SyncState.Complete -> {
                        putString("status", "complete")
                        putArray("affectedDates", Arguments.fromList(state.affectedDates))
                    }
                    is SyncState.Error -> {
                        putString("status", "error")
                        putString("message", state.message)
                    }
                }
            },
        )
    }

    fun emitDeviceEvent(event: DeviceEvent) {
        val params = Arguments.createMap()
        when (event.eventNum) {
            EventNumber.WRIST_ON -> emit("onWristOn", params)
            EventNumber.WRIST_OFF -> emit("onWristOff", params)
            EventNumber.CHARGING_ON -> emit("onChargingOn", params)
            EventNumber.CHARGING_OFF -> emit("onChargingOff", params)
            EventNumber.DOUBLE_TAP -> emit("onDoubleTap", params)
            EventNumber.BLE_REALTIME_HR_ON -> emit("onRealtimeHROn", params)
            EventNumber.BLE_REALTIME_HR_OFF -> emit("onRealtimeHROff", params)
            EventNumber.BATTERY_LEVEL -> emit("onBatteryLevel", params)
            EventNumber.EXTENDED_BATTERY_INFORMATION -> emit("onExtendedBatteryInfo", params)
            EventNumber.STRAP_CONDITION_REPORT -> {
                val condition =
                    strapConditionParser.parse(event.payload)?.data
                        as? StrapCondition ?: return
                log.d {
                    "StrapCondition: battery=${condition.batteryPercent}% charging=${condition.charging} onWrist=${condition.onWrist}"
                }
                emit(
                    "onBatteryLevel",
                    Arguments.createMap().apply {
                        putInt("level", condition.batteryPercent)
                    },
                )
                if (condition.charging) {
                    emit("onChargingOn", Arguments.createMap())
                } else {
                    emit("onChargingOff", Arguments.createMap())
                }
                if (condition.onWrist) {
                    emit("onWristOn", Arguments.createMap())
                } else {
                    emit("onWristOff", Arguments.createMap())
                }
            }
            else -> log.d { "Unhandled device event: 0x${event.eventNum.toString(16)}" }
        }
    }

    fun emitNapSleepOnset(startTs: Long) {
        emit(
            "onNapSleepOnset",
            Arguments.createMap().apply {
                putDouble("startTs", startTs.toDouble())
            },
        )
    }

    fun emitInAppNotification(
        type: String,
        payload: String?,
    ) {
        emit(
            "onInAppNotification",
            Arguments.createMap().apply {
                putString("type", type)
                if (payload != null) putString("payload", payload) else putNull("payload")
            },
        )
    }
}
