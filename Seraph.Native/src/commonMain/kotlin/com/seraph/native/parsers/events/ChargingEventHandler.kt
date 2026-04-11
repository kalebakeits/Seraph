package com.seraph.native.parsers.events

import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.EventNumber

class ChargingOnEventHandler : IEventHandler {
    override val eventNumber = EventNumber.CHARGING_ON

    override fun parse(payload: ByteArray): ParseResult = ParseResult(eventType = "chargingOn", data = null, rawPayload = null)
}

class ChargingOffEventHandler : IEventHandler {
    override val eventNumber = EventNumber.CHARGING_OFF

    override fun parse(payload: ByteArray): ParseResult = ParseResult(eventType = "chargingOff", data = null, rawPayload = null)
}
