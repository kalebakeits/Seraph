package com.seraph.native.parsers.data.system

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.IPacketHandler
import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.MetadataType
import com.seraph.native.protocol.PacketMetadata
import com.seraph.native.protocol.PacketType

private val log = Logger.withTag("MetadataHandler")

class MetadataHandler : IPacketHandler {
    override val packetType = PacketType.METADATA

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 3) {
            log.w { "Metadata payload too short (${payload.size}b)" }
            return null
        }
        val type = payload[2]

        if (type == MetadataType.HISTORY_COMPLETE) {
            log.d { "HISTORY_COMPLETE" }
            return ParseResult(eventType = null, data = PacketMetadata(type, -1), rawPayload = null)
        }

        if (payload.size < 17) {
            log.w { "Metadata payload too short for type $type (${payload.size}b)" }
            return null
        }

        fun uint8(i: Int) = payload[i].toInt() and 0xFF
        val trimValue = uint8(13) or (uint8(14) shl 8) or (uint8(15) shl 16) or (uint8(16) shl 24)

        log.d { "Metadata type=$type trimValue=$trimValue" }
        return ParseResult(eventType = null, data = PacketMetadata(type, trimValue), rawPayload = null)
    }
}
