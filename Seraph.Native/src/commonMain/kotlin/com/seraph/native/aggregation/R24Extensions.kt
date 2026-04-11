package com.seraph.native.aggregation

import com.seraph.core.calculators.parseRr
import com.seraph.core.model.R24Input
import com.seraph.native.db.R24

/** Converts a SQLDelight R24 row to Core's R24Input. */
fun R24.toR24Input(): R24Input =
    R24Input(
        timestamp = timestamp,
        heartRate = heart_rate.toInt(),
        rrIntervals = parseRr(rr_intervals),
        stepCount = step_count.toInt(),
        b80 = b80.toInt(),
    )
