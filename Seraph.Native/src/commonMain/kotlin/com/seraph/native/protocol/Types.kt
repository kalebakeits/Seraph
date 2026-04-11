package com.seraph.native.protocol

object PacketType {
    const val COMMAND: Byte = 0x23 // 35
    const val COMMAND_RESPONSE: Byte = 0x24 // 36
    const val REALTIME_DATA: Byte = 0x28 // 40
    const val HISTORICAL_DATA: Byte = 0x2F // 47
    const val EVENT: Byte = 0x30 // 48
    const val METADATA: Byte = 0x31 // 49
    const val CONSOLE_LOGS: Byte = 0x32 // 50
}

object CommandNumber {
    const val LINK_VALID: Byte = 1
    const val TOGGLE_REALTIME_HR: Byte = 3
    const val REPORT_VERSION_INFO: Byte = 7
    const val SET_CLOCK: Byte = 10
    const val GET_CLOCK: Byte = 11
    const val ABORT_HISTORICAL_TRANSMITS: Byte = 20
    const val SEND_HISTORICAL_DATA: Byte = 22
    const val HISTORICAL_DATA_RESULT: Byte = 23
    const val FORCE_TRIM: Byte = 25
    const val GET_BATTERY_LEVEL: Byte = 26
    const val REBOOT_STRAP: Byte = 29
    const val GET_HELLO_HARVARD: Byte = 35
    const val SET_ALARM_TIME: Byte = 66
    const val GET_ALARM_TIME: Byte = 67
    const val RUN_ALARM: Byte = 68
    const val DISABLE_ALARM: Byte = 69
    const val RUN_HAPTICS_PATTERN: Byte = 79
}

object MetadataType {
    const val HISTORY_START: Byte = 0x01
    const val HISTORY_END: Byte = 0x02
    const val HISTORY_COMPLETE: Byte = 0x03
}

object HistoricalDataSubtype {
    const val R24: Byte = 24
    const val R25: Byte = 25
}

object EventNumber {
    const val BATTERY_LEVEL: Byte = 3
    const val CHARGING_ON: Byte = 7
    const val CHARGING_OFF: Byte = 8
    const val WRIST_ON: Byte = 9
    const val WRIST_OFF: Byte = 10
    const val DOUBLE_TAP: Byte = 14
    const val STRAP_CONDITION_REPORT: Byte = 29
    const val BLE_REALTIME_HR_ON: Byte = 33
    const val BLE_REALTIME_HR_OFF: Byte = 34
    const val EXTENDED_BATTERY_INFORMATION: Byte = 63
}

data class PacketMetadata(
    val type: Byte,
    val trimValue: Int,
)

data class R24Packet(
    val sequence: Int,
    val timestampMs: Long, // already *1000 — stored as ms
    val subseconds: Int,
    val b2: Int,
    val skinTemp: Float,
    val heartRate: Int,
    val rrIntervals: List<Int>,
    val stepCount: Int,
    val b80: Int,
    val rawPayload: ByteArray,
)
