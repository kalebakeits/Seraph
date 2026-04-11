package com.seraph.native.parsers.data.historical

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.IPacketHandler
import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.HistoricalDataSubtype

private val log = Logger.withTag("R25Handler")

class R25Handler : IPacketHandler {
    override val packetType = HistoricalDataSubtype.R25

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 24) {
            log.w { "R25 payload too short (${payload.size}b)" }
            return null
        }
        log.d { "R25 ${payload.size}b (raw, not stored)" }
        return ParseResult(eventType = "historicalR25Data", data = null, rawPayload = payload)
    }
}
