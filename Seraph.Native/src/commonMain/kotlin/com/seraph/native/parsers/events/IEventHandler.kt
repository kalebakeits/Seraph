package com.seraph.native.parsers.events

import com.seraph.native.parsers.ParseResult

interface IEventHandler {
    val eventNumber: Byte

    fun parse(payload: ByteArray): ParseResult?
}
