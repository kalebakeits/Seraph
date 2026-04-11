package com.seraph.native.parsers

/**
 * Result from parsing a DATA_FROM_STRAP packet.
 * eventType null means no event should be emitted (e.g. metadata goes to channel).
 */
data class ParseResult(
    val eventType: String?,
    val data: Any?,
    val rawPayload: ByteArray?,
)
