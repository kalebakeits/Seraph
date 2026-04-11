package com.seraph.native.parsers.events

import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.EventNumber

class WristOnEventHandler : IEventHandler {
    override val eventNumber = EventNumber.WRIST_ON

    override fun parse(payload: ByteArray): ParseResult = ParseResult(eventType = "wristOn", data = null, rawPayload = null)
}

class WristOffEventHandler : IEventHandler {
    override val eventNumber = EventNumber.WRIST_OFF

    override fun parse(payload: ByteArray): ParseResult = ParseResult(eventType = "wristOff", data = null, rawPayload = null)
}
