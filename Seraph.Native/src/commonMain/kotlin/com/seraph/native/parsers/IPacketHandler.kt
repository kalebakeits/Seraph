package com.seraph.native.parsers

interface IPacketHandler {
    val packetType: Byte

    fun parse(payload: ByteArray): ParseResult?
}
