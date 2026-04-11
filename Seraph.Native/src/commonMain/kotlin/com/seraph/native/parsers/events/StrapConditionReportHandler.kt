package com.seraph.native.parsers.events

import co.touchlab.kermit.Logger
import com.seraph.native.parsers.ParseResult
import com.seraph.native.protocol.EventNumber

private val log = Logger.withTag("StrapCondition")

/**
 * Event 29 — STRAP_CONDITION_REPORT
 *
 * Payload after framing strip: [type=0x30, seq, event=29, data(10+ bytes)]
 * Data section (payload[3..]):
 *   [0..3]  flashBacklogPages  (UInt32 LE)
 *   [4..5]  flashBacklogTenths (Int16 LE / 10)
 *   [6..7]  socTenths          (Int16 LE / 10) — battery %
 *   [8]     flashStatus
 *   [9]     chargingStatus     (0=not charging, 1=charging)
 *   [10]    wristState         (0=off, 1=on)
 */
data class StrapCondition(
    val batteryPercent: Int, // 0–100
    val charging: Boolean,
    val onWrist: Boolean,
)

class StrapConditionReportHandler : IEventHandler {
    override val eventNumber = EventNumber.STRAP_CONDITION_REPORT

    override fun parse(payload: ByteArray): ParseResult? {
        if (payload.size < 13) return null // need at least 3 header + 10 data bytes

        fun uint8(i: Int) = payload[i].toInt() and 0xFF

        fun int16Le(i: Int) =
            (uint8(i) or (uint8(i + 1) shl 8)).let {
                if (it and 0x8000 != 0) it - 0x10000 else it
            }

        // payload[3..] is data. socTenths at data[16..17] = payload[19..20]
        // chargingStatus at data[20] = payload[23], wristState at data[21] = payload[24] - but packet is 24b so check size
        val socTenths = int16Le(19)
        val batteryPercent = (socTenths / 10.0).coerceIn(0.0, 100.0).toInt()
        val charging = if (payload.size > 20) uint8(20) != 0 else false
        val onWrist = if (payload.size > 21) uint8(21) != 0 else false
        log.d { "parsed → socTenths=$socTenths battery=$batteryPercent% charging=$charging onWrist=$onWrist" }

        return ParseResult(
            eventType = "strapCondition",
            data = StrapCondition(batteryPercent, charging, onWrist),
            rawPayload = null,
        )
    }
}
