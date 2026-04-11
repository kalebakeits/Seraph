package com.seraph.core.model

/**
 * One R24 record from the device.
 *
 * @param timestamp    Unix epoch milliseconds
 * @param heartRate    BPM (possibly 0 = invalid)
 * @param rrIntervals  RR intervals in milliseconds (already parsed from packet)
 * @param stepCount    Raw step counter value possibly x2 magnitude
 * @param b80          Device state byte
 */
data class R24Input(
    val timestamp: Long,
    val heartRate: Int,
    val rrIntervals: List<Int>,
    val stepCount: Int,
    val b80: Int,
)
