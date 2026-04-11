package com.seraph.core.calculators

import com.seraph.core.model.DailyHRV
import com.seraph.core.model.R24Input
import kotlin.math.abs
import kotlin.math.sqrt

private const val RR_MIN = 300
private const val RR_MAX = 2000
private const val RR_SENTINEL = 333
private const val MAX_SUCCESSIVE_DIFF = 200

fun calculateHRV(records: List<R24Input>): DailyHRV {
    val squaredDiffs = mutableListOf<Double>()

    for (r in records) {
        val valid = r.rrIntervals.filter { rr -> rr in RR_MIN..RR_MAX && rr != RR_SENTINEL }
        if (valid.size < 2) continue

        for (i in 1 until valid.size) {
            val diff = abs(valid[i] - valid[i - 1])
            if (diff <= MAX_SUCCESSIVE_DIFF) {
                squaredDiffs.add(diff.toDouble() * diff.toDouble())
            }
        }
    }

    if (squaredDiffs.size < 2) return DailyHRV(rmssd = 0.0, sampleCount = 0)

    val rmssd = sqrt(squaredDiffs.sum() / squaredDiffs.size)
    val rounded = (rmssd * 10).toLong() / 10.0

    return DailyHRV(rmssd = rounded, sampleCount = squaredDiffs.size)
}

/**
 * Parses a JSON-encoded RR intervals string "[300,450,510]" into a list of ints.
 * Filters to valid range and removes the 333ms sentinel value.
 */
fun parseRr(json: String?): List<Int> {
    if (json.isNullOrBlank() || json == "[]") return emptyList()
    return json
        .trim('[', ']')
        .split(',')
        .mapNotNull { it.trim().toIntOrNull() }
        .filter { it in RR_MIN..RR_MAX && it != RR_SENTINEL }
}
