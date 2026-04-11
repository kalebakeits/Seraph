package com.seraph.native.parsers.data.historical

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.IPacketHandler
import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.HistoricalDataSubtype
import com.seraph.native.protocol.R24Packet

private val log = Logger.withTag("R24Handler")

class R24Handler : IPacketHandler {
    override val packetType = HistoricalDataSubtype.R24

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 27) {
            log.w { "R24 payload too short (${payload.size}b)" }
            return null
        }

        fun uint8(i: Int) = payload[i].toInt() and 0xFF

        fun uint16Le(i: Int) = uint8(i) or (uint8(i + 1) shl 8)

        fun uint32Le(i: Int) =
            uint8(i).toLong() or
                (uint8(i + 1).toLong() shl 8) or
                (uint8(i + 2).toLong() shl 16) or
                (uint8(i + 3).toLong() shl 24)

        val b2 = uint8(2)
        val sequence = uint32Le(3).toInt()
        val timestampMs = uint32Le(7) * 1000L
        val subseconds = uint16Le(11)
        val skinTemp = uint16Le(15) / 10f
        val heartRate = uint8(17)
        val rrCount = uint8(18)
        val rrIntervals = (0 until minOf(rrCount, 4)).map { i -> uint16Le(19 + i * 2) }
        val b80 = if (payload.size >= 81) uint8(80) else 0
        val stepCount = if (payload.size >= 90) uint16Le(88) else 0

        val packet =
            R24Packet(
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

        log.d { "R24 seq=$sequence ts=$timestampMs (${payload.size}b)" }

        return ParseResult(eventType = "historicalR24Data", data = packet, rawPayload = payload)
    }
}
