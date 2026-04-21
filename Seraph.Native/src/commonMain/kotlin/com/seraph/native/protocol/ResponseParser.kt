package com.seraph.native.protocol

import co.touchlab.kermit.Logger

private val log = Logger.withTag("ResponseParser")

object ResponseParser {
    data class BatteryInfo(
        val level: Float,
        val rawValue: Int,
    )

    data class VersionInfo(
        val harvard: String,
        val boylston: String,
    )

    data class HelloHarvard(
        val charging: Boolean,
        val onWrist: Boolean,
    )

    fun parseBattery(data: ByteArray): BatteryInfo? {
        val parsed = Framing.parsePacket(data)
        val valid = parsed.valid
        val payload = parsed.payload
        if (!valid || payload == null || payload.size < 7) return null
        val rawValue = (payload[5].toInt() and 0xFF) or ((payload[6].toInt() and 0xFF) shl 8)
        return BatteryInfo(rawValue / 10f, rawValue)
    }

    fun parseVersionInfo(data: ByteArray): VersionInfo? {
        val parsed = Framing.parsePacket(data)
        val valid = parsed.valid
        val payload = parsed.payload
        log.d { "parseVersionInfo: valid=$valid payloadSize=${payload?.size}" }
        if (!valid || payload == null || payload.size < 38) return null
        var offset = 6

        fun nextInt(): Int {
            val v =
                (payload[offset].toInt() and 0xFF) or
                    ((payload[offset + 1].toInt() and 0xFF) shl 8) or
                    ((payload[offset + 2].toInt() and 0xFF) shl 16) or
                    ((payload[offset + 3].toInt() and 0xFF) shl 24)
            offset += 4
            return v
        }
        val hMaj = nextInt()
        val hMin = nextInt()
        val hPat = nextInt()
        val hBld = nextInt()
        val bMaj = nextInt()
        val bMin = nextInt()
        val bPat = nextInt()
        val bBld = nextInt()
        return VersionInfo("$hMaj.$hMin.$hPat.$hBld", "$bMaj.$bMin.$bPat.$bBld")
    }

    fun parseHelloHarvard(data: ByteArray): HelloHarvard? {
        val parsed = Framing.parsePacket(data)
        val valid = parsed.valid
        val payload = parsed.payload
        if (!valid || payload == null || payload.size < 120) return null
        return HelloHarvard(payload[10] != 0.toByte(), payload[119] != 0.toByte())
    }

    /**
     * Returns clock value in SECONDS (not ms). Callers multiply by 1000 for display only.
     * Response: [type, seq, cmd, 00, 01, timestamp(4 LE), ...]
     */
    fun parseClock(data: ByteArray): Int? {
        val parsed = Framing.parsePacket(data)
        val valid = parsed.valid
        val payload = parsed.payload
        if (!valid || payload == null || payload.size < 9) return null
        if (payload[2] != CommandNumber.GET_CLOCK) return null
        val seconds =
            (payload[5].toInt() and 0xFF) or
                ((payload[6].toInt() and 0xFF) shl 8) or
                ((payload[7].toInt() and 0xFF) shl 16) or
                ((payload[8].toInt() and 0xFF) shl 24)
        log.d { "parseClock: seconds=$seconds" }
        return seconds
    }

    /**
     * Returns alarm time in SECONDS.
     * Response: [type, seq, cmd, 00, 01, 01, 01, timestamp(4 LE), ...]
     */
    fun parseAlarmTime(data: ByteArray): Int? {
        val parsed = Framing.parsePacket(data)
        val valid = parsed.valid
        val payload = parsed.payload
        if (!valid || payload == null || payload.size < 12) return null
        if (payload[2] != CommandNumber.GET_ALARM_TIME) return null
        return (payload[7].toInt() and 0xFF) or
            ((payload[8].toInt() and 0xFF) shl 8) or
            ((payload[9].toInt() and 0xFF) shl 16) or
            ((payload[10].toInt() and 0xFF) shl 24)
    }

    fun parseMetadata(data: ByteArray): PacketMetadata? {
        val parsed = Framing.parsePacket(data)
        val valid = parsed.valid
        val payload = parsed.payload
        if (!valid || payload == null || payload.size < 3) return null
        val type = payload[2]
        if (type == MetadataType.HISTORY_COMPLETE) return PacketMetadata(type, -1)
        if (payload.size < 14) return null
        val trimValue =
            (payload[13].toInt() and 0xFF) or
                ((payload[14].toInt() and 0xFF) shl 8) or
                ((payload[15].toInt() and 0xFF) shl 16) or
                ((payload[16].toInt() and 0xFF) shl 24)
        return PacketMetadata(type, trimValue)
    }

    /**
     * Parse a historical R24 data packet.
     *
     * Byte offsets (within payload, after framing strip):
     *   [2]      = packet subtype (should be HistoricalDataSubtype.R24 = 24)
     *   [3]      = b2
     *   [3..6]   = sequence (UInt32 LE) — offset 3
     *   [7..10]  = timestamp in SECONDS (UInt32 LE) — multiply by 1000 for ms
     *   [11..12] = subseconds (UInt16 LE)
     *   [15..16] = skin temp (UInt16 LE) / 10
     *   [17]     = heart rate
     *   [18]     = RR count
     *   [19..]   = RR intervals (UInt16 LE each, up to 4)
     *   [80]     = b80 (if payload >= 81)
     *   [88..89] = step count (UInt16 LE, if payload >= 90)
     */
    fun parseR24(payload: ByteArray): R24Packet? {
        if (payload.size < 27) return null

        fun uint8(i: Int) = payload[i].toInt() and 0xFF

        fun uint16Le(i: Int) = uint8(i) or (uint8(i + 1) shl 8)

        fun uint32Le(i: Int) =
            uint8(i).toLong() or
                (uint8(i + 1).toLong() shl 8) or
                (uint8(i + 2).toLong() shl 16) or
                (uint8(i + 3).toLong() shl 24)

        val b2 = uint8(2)
        val sequence = uint32Le(3).toInt()
        val tsSeconds = uint32Le(7)
        val timestampMs = tsSeconds * 1000L
        val subseconds = uint16Le(11)
        val skinTemp = uint16Le(15) / 10f
        val heartRate = uint8(17)

        val rrCount = uint8(18)
        val rrIntervals = (0 until minOf(rrCount, 4)).map { i -> uint16Le(19 + i * 2) }

        val b80 = if (payload.size >= 81) uint8(80) else 0
        val stepCount = if (payload.size >= 90) uint16Le(88) else 0

        return R24Packet(
            sequence = sequence,
            timestampMs = timestampMs,
            subseconds = subseconds,
            b2 = b2,
            skinTemp = skinTemp,
            heartRate = heartRate,
            rrIntervals = rrIntervals,
            stepCount = stepCount,
            b80 = b80,
            rawPayload = payload,
        )
    }
}
