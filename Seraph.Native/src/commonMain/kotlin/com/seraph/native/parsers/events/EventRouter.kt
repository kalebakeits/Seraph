package com.seraph.native.parsers.events

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.ParseResult

private val log = Logger.withTag("EventRouter")

class EventRouter(
    private val handlers: Map<Byte, IEventHandler>,
) {
    // Event packet: [type=EVENT, seq, event_number, ...]
    fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 3) {
            log.w { "Event payload too short (${payload.size}b)" }
            return null
        }
        val eventNum = payload[2]
        log.d { "Event 0x${eventNum.toInt().and(0xFF).toString(16)} (${payload.size}b)" }
        val handler = handlers[eventNum]
        if (handler == null) {
            return null
        }
        return handler.parse(payload)
    }

    companion object {
        fun build(): EventRouter {
            val list: List<IEventHandler> =
                listOf(
                    WristOnEventHandler(),
                    WristOffEventHandler(),
                    ChargingOnEventHandler(),
                    ChargingOffEventHandler(),
                    DoubleTapEventHandler(),
                    BatteryLevelEventHandler(),
                    ExtendedBatteryInfoEventHandler(),
                    StrapConditionReportHandler(),
                )
            return EventRouter(list.associateBy { it.eventNumber })
        }
    }
}
