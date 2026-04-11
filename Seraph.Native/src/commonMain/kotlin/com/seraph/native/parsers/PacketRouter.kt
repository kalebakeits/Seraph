package com.seraph.native.parsers

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.data.historical.HistoricalDataRouter
import com.seraph.native.parsers.data.system.MetadataHandler
import com.seraph.native.parsers.events.EventRouter
import com.seraph.native.protocol.PacketType

private val log = Logger.withTag("PacketRouter")

class PacketRouter(
    private val historicalDataRouter: HistoricalDataRouter,
    private val metadataHandler: MetadataHandler,
    private val eventRouter: EventRouter,
) {
    private val handlers: Map<Byte, IPacketHandler> =
        mapOf(
            PacketType.HISTORICAL_DATA to historicalDataRouter,
            PacketType.METADATA to metadataHandler,
        )

    fun route(payload: ByteArray): ParseResult? {
        if (payload.isEmpty()) return null
        val packetType = payload[0]

        if (packetType == PacketType.EVENT) {
            return eventRouter.parse(payload)
        }

        val handler = handlers[packetType]
        if (handler == null) {
            log.d { "No handler for packet type 0x${packetType.toInt().and(0xFF).toString(16)}" }
            return null
        }
        return handler.parse(payload)
    }

    companion object {
        fun build(): PacketRouter =
            PacketRouter(
                historicalDataRouter = HistoricalDataRouter.build(),
                metadataHandler = MetadataHandler(),
                eventRouter = EventRouter.build(),
            )
    }
}
