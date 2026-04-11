package com.seraph.native.parsers.events

import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.EventNumber

class BatteryLevelEventHandler : IEventHandler {
    override val eventNumber = EventNumber.BATTERY_LEVEL

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 4) return null
        return ParseResult(eventType = "batteryLevel", data = null, rawPayload = null)
    }
}

class ExtendedBatteryInfoEventHandler : IEventHandler {
    override val eventNumber = EventNumber.EXTENDED_BATTERY_INFORMATION

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 4) return null
        return ParseResult(eventType = "extendedBatteryInfo", data = null, rawPayload = null)
    }
}
