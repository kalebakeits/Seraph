package com.seraph.native.parsers.events

import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.EventNumber

class DoubleTapEventHandler : IEventHandler {
    override val eventNumber = EventNumber.DOUBLE_TAP

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 3) return null
        return ParseResult(eventType = "doubleTap", data = null, rawPayload = null)
    }
}
