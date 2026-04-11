package com.seraph.native.parsers.data.historical

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.IPacketHandler
import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.PacketType

private val log = Logger.withTag("HistoricalDataRouter")

class HistoricalDataRouter(
    private val handlers: Map<Byte, IPacketHandler>,
) : IPacketHandler {
    override val packetType = PacketType.HISTORICAL_DATA

    // payload[1] is the subtype (confirmed from TS reference impl)
    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 4) {
            log.w { "Historical payload too short (${payload.size}b)" }
            return null
        }
        val subtype = payload[1]
        val handler = handlers[subtype]
        if (handler == null) {
            log.w { "No handler for historical subtype 0x${subtype.toInt().and(0xFF).toString(16)}" }
            return null
        }
        return handler.parse(payload)
    }

    companion object {
        fun build(): HistoricalDataRouter {
            val list: List<IPacketHandler> = listOf(R24Handler(), R25Handler())
            return HistoricalDataRouter(list.associateBy { it.packetType })
        }
    }
}
