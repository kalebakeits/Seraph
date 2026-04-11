package com.seraph.core.calculators

import com.seraph.core.model.DailySteps
import com.seraph.core.model.R24Input

private const val STEP_WRAP_VALUE = 65536

fun calculateSteps(records: List<R24Input>): DailySteps {
    if (records.size < 2) return DailySteps(0)

    // Split into segments at each reset-to-0, sum last-first per segment.
    // Handles device resetting counter on charge/off-wrist events.
    var total = 0
    var segStart = records.first().stepCount
    var inReset = false

    for (i in 1 until records.size) {
        val prev = records[i - 1].stepCount
        val curr = records[i].stepCount
        if (curr == 0 && prev > 0) {
            // Counter reset — close current segment
            val delta = if (prev < segStart) prev + STEP_WRAP_VALUE - segStart else prev - segStart
            total += delta
            inReset = true
        } else if (inReset && curr > 0) {
            // First non-zero after reset — device restored pre-reboot value, use as new baseline
            segStart = curr
            inReset = false
        }
    }
    // Close final segment
    if (!inReset) {
        val last = records.last().stepCount
        val delta = if (last < segStart) last + STEP_WRAP_VALUE - segStart else last - segStart
        total += delta
    }

    return DailySteps(total / 2)
}
