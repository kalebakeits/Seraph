package com.seraph.native.protocol

object Framing {
    private fun crc8(data: ByteArray): Int {
        var crc = 0
        for (b in data) {
            crc = crc xor (b.toInt() and 0xFF)
            repeat(8) {
                crc = if (crc and 0x80 != 0) (crc shl 1) xor 0x07 else crc shl 1
            }
        }
        return crc and 0xFF
    }

    private fun crc32(data: ByteArray): Long {
        var crc = 0xFFFFFFFFL
        for (b in data) {
            crc = crc xor (b.toLong() and 0xFF)
            repeat(8) {
                crc = if (crc and 1L != 0L) (crc ushr 1) xor 0xEDB88320L else crc ushr 1
            }
        }
        return crc.inv() and 0xFFFFFFFFL
    }

    fun buildPacket(payload: ByteArray): ByteArray {
        val length = payload.size + 4 // payload + CRC32
        val lengthBytes =
            byteArrayOf(
                (length and 0xFF).toByte(),
                ((length shr 8) and 0xFF).toByte(),
            )
        val crc8Val = crc8(lengthBytes)
        val crc32Val = crc32(payload)
        val crc32Bytes =
            byteArrayOf(
                (crc32Val and 0xFF).toByte(),
                ((crc32Val shr 8) and 0xFF).toByte(),
                ((crc32Val shr 16) and 0xFF).toByte(),
                ((crc32Val shr 24) and 0xFF).toByte(),
            )

        // [SOF(1)] [length(2)] [crc8(1)] [payload(n)] [crc32(4)]
        return byteArrayOf(0xAA.toByte()) +
            lengthBytes +
            crc8Val.toByte() +
            payload +
            crc32Bytes
    }

    data class ParsedPacket(
        val valid: Boolean,
        val payload: ByteArray?,
    )

    fun parsePacket(data: ByteArray): ParsedPacket {
        if (data.size < 8) return ParsedPacket(false, null)
        if (data[0] != 0xAA.toByte()) return ParsedPacket(false, null)

        val length = (data[1].toInt() and 0xFF) or ((data[2].toInt() and 0xFF) shl 8)
        val payloadLength = length - 4

        if (data.size < 4 + payloadLength + 4) return ParsedPacket(false, null)

        return ParsedPacket(true, data.copyOfRange(4, 4 + payloadLength))
    }
}
