package com.seraph.core.calculators

import com.seraph.core.model.R24Input
import kotlin.math.exp

data class TrimpResult(
    val trimp: Double,
)

data class ZoneSeconds(
    val z1: Long,
    val z2: Long,
    val z3: Long,
    val z4: Long,
    val z5: Long,
) {
    fun toJson(): String = """{"z1":$z1,"z2":$z2,"z3":$z3,"z4":$z4,"z5":$z5}"""
}

/**
 * Exponential TRIMP across a window of timestamped HR samples.
 *
 * Each inter-sample interval contributes: dtMin * HRR * 0.64 * e^(1.92 * HRR)
 * where HRR = (HR - rhr) / (maxHr - rhr), clamped to [0, 1].
 * Gaps > 5 min are skipped (off-wrist / pause).
 */
fun calcTrimp(
    records: List<R24Input>,
    rhr: Double,
    maxHr: Double,
): Double {
    val valid = records.filter { it.heartRate in 30..220 }
    if (valid.size < 2) return 0.0
    val range = maxHr - rhr
    if (range <= 0) return 0.0
    var trimp = 0.0
    for (i in 1 until valid.size) {
        val dtMin = (valid[i].timestamp - valid[i - 1].timestamp) / 60000.0
        if (dtMin <= 0 || dtMin > 5) continue
        val hrr = ((valid[i].heartRate - rhr) / range).coerceIn(0.0, 1.0)
        trimp += dtMin * hrr * 0.64 * exp(1.92 * hrr)
    }
    return trimp
}

/**
 * Time-in-zone accumulation using FTHR-relative boundaries.
 * Zone thresholds: Z1 <72%, Z2 <83%, Z3 <94%, Z4 <105%, Z5 >=105%.
 * Inter-sample intervals clamped to 60s to reject gaps.
 */
fun calcZoneSeconds(
    records: List<R24Input>,
    fthr: Double,
): ZoneSeconds {
    val valid = records.filter { it.heartRate > 0 }
    var z1 = 0L
    var z2 = 0L
    var z3 = 0L
    var z4 = 0L
    var z5 = 0L
    for (i in 1 until valid.size) {
        val hr = valid[i].heartRate.toDouble()
        val dt = ((valid[i].timestamp - valid[i - 1].timestamp) / 1000L).coerceIn(0L, 60L)
        when {
            hr < fthr * 0.72 -> z1 += dt
            hr < fthr * 0.83 -> z2 += dt
            hr < fthr * 0.94 -> z3 += dt
            hr < fthr * 1.05 -> z4 += dt
            else -> z5 += dt
        }
    }
    return ZoneSeconds(z1, z2, z3, z4, z5)
}

/**
 * Downsamples HR from in-memory records into ~[maxPoints] time buckets.
 * bucketMs should be set by the caller as (sessionDurationMs / maxPoints)
 * so the result naturally fits in one pass without skip logic.
 * Returns JSON array: [{"t":<bucketStartMs>,"hr":<avg>}, ...].
 */
fun sampleHR(
    records: List<R24Input>,
    bucketMs: Long,
): String {
    val valid = records.filter { it.heartRate > 0 }
    val buckets = mutableMapOf<Long, MutableList<Int>>()
    for (r in valid) {
        buckets.getOrPut((r.timestamp / bucketMs) * bucketMs) { mutableListOf() }.add(r.heartRate)
    }
    val sorted = buckets.entries.sortedBy { it.key }
    return "[${sorted.joinToString(",") { (b, hrs) ->
        """{"t":$b,"hr":${hrs.sum() / hrs.size}}"""
    }}]"
}
