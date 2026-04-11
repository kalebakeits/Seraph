package com.seraph.native.protocol

object Commands {
    private fun simple(cmd: Byte): ByteArray = Framing.buildPacket(byteArrayOf(PacketType.COMMAND, 0, cmd, 0x00))

    fun getBatteryLevel() = simple(CommandNumber.GET_BATTERY_LEVEL)

    fun getVersionInfo() = simple(CommandNumber.REPORT_VERSION_INFO)

    fun getHelloHarvard() = simple(CommandNumber.GET_HELLO_HARVARD)

    fun getClock() = simple(CommandNumber.GET_CLOCK)

    fun getAlarmTime() = simple(CommandNumber.GET_ALARM_TIME)

    fun disableAlarm() = simple(CommandNumber.DISABLE_ALARM)

    fun runAlarm() = simple(CommandNumber.RUN_ALARM)

    fun runHaptics() = simple(CommandNumber.RUN_HAPTICS_PATTERN)

    fun reboot() = simple(CommandNumber.REBOOT_STRAP)

    fun sendHistoricalData() = simple(CommandNumber.SEND_HISTORICAL_DATA)

    fun abortHistoricalTransmits() = simple(CommandNumber.ABORT_HISTORICAL_TRANSMITS)

    fun toggleRealtimeHR(enable: Boolean) =
        Framing.buildPacket(
            byteArrayOf(PacketType.COMMAND, 0, CommandNumber.TOGGLE_REALTIME_HR, if (enable) 0x01 else 0x00),
        )

    /**
     * Set the device clock.
     *
     * IMPORTANT: unixTimestampSec MUST be in SECONDS not milliseconds.
     * Pass: (System.currentTimeMillis() / 1000).toInt()
     * Wrong timestamps = data recorded with wrong dates (2068 bug).
     *
     * Packet: [COMMAND, 0, SET_CLOCK, timestamp(4 bytes LE), 0x00]
     */
    fun setClock(unixTimestampSec: Int): ByteArray {
        val ts = unixTimestampSec
        val tsBytes =
            byteArrayOf(
                (ts and 0xFF).toByte(),
                ((ts shr 8) and 0xFF).toByte(),
                ((ts shr 16) and 0xFF).toByte(),
                ((ts shr 24) and 0xFF).toByte(),
                0x00,
            )
        return Framing.buildPacket(byteArrayOf(PacketType.COMMAND, 0, CommandNumber.SET_CLOCK) + tsBytes)
    }

    /**
     * Set alarm time.
     * Packet: [COMMAND, 0, SET_ALARM_TIME, 0x00, timestamp(4 bytes LE)]
     * Note: leading 0x00 before timestamp — different layout from setClock.
     */
    fun setAlarmTime(unixTimestampSec: Int): ByteArray {
        val ts = unixTimestampSec
        val tsBytes =
            byteArrayOf(
                0x00,
                (ts and 0xFF).toByte(),
                ((ts shr 8) and 0xFF).toByte(),
                ((ts shr 16) and 0xFF).toByte(),
                ((ts shr 24) and 0xFF).toByte(),
            )
        return Framing.buildPacket(byteArrayOf(PacketType.COMMAND, 0, CommandNumber.SET_ALARM_TIME) + tsBytes)
    }

    /**
     * ACK a HISTORY_END batch with the trim value received.
     * Packet: [COMMAND, 0, HISTORICAL_DATA_RESULT, 0x01, trimValue(4 LE), padding(4)]
     */
    fun sendHistoricalDataResult(trimValue: Int): ByteArray {
        val tv = trimValue
        val data =
            byteArrayOf(
                0x01,
                (tv and 0xFF).toByte(),
                ((tv shr 8) and 0xFF).toByte(),
                ((tv shr 16) and 0xFF).toByte(),
                ((tv shr 24) and 0xFF).toByte(),
                0,
                0,
                0,
                0, // padding
            )
        return Framing.buildPacket(byteArrayOf(PacketType.COMMAND, 0, CommandNumber.HISTORICAL_DATA_RESULT) + data)
    }

    /**
     * Force trim to a specific value.
     * Packet: [COMMAND, 0, FORCE_TRIM, 0x01, trimValue(4 LE), padding(4)]
     */
    fun forceTrim(trimValue: Int): ByteArray {
        val tv = trimValue
        val data =
            byteArrayOf(
                0x01,
                (tv and 0xFF).toByte(),
                ((tv shr 8) and 0xFF).toByte(),
                ((tv shr 16) and 0xFF).toByte(),
                ((tv shr 24) and 0xFF).toByte(),
                0,
                0,
                0,
                0,
            )
        return Framing.buildPacket(byteArrayOf(PacketType.COMMAND, 0, CommandNumber.FORCE_TRIM) + data)
    }

    /**
     * Erase all device data.
     * Sentinel: FORCE_TRIM with two 0xFEFEFEFE ints — no prefix byte.
     */
    fun eraseAllData(): ByteArray {
        val data =
            byteArrayOf(
                0xFE.toByte(),
                0xFE.toByte(),
                0xFE.toByte(),
                0xFE.toByte(),
                0xFE.toByte(),
                0xFE.toByte(),
                0xFE.toByte(),
                0xFE.toByte(),
                0x00,
            )
        return Framing.buildPacket(byteArrayOf(PacketType.COMMAND, 0, CommandNumber.FORCE_TRIM) + data)
    }
}
