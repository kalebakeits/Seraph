package com.seraph.core.calculators

import com.seraph.core.model.DailyHR
import com.seraph.core.model.R24Input
import kotlin.math.abs

private const val HR_MIN = 30
private const val HR_MAX = 220
private const val PEAK_BUILDUP_MS = 2 * 60 * 1000L
private const val PEAK_SUSTAINED_MS = 30 * 1000L
private const val PEAK_DECLINE_MS = 1 * 60 * 1000L
private const val PEAK_SUSTAINED_TOLERANCE = 5

fun getMaxHR(age: Int? = null): Int = if (age != null) 220 - age else 208

fun calculateHR(records: List<R24Input>): DailyHR {
    val valid = records.filter { it.heartRate in HR_MIN..HR_MAX }

    if (valid.isEmpty()) {
        return DailyHR(avgHr = 0, maxHr = 0, maxHrValidated = false)
    }

    val avgHr = valid.map { it.heartRate }.average()
    val peakIndex = valid.indices.maxByOrNull { valid[it].heartRate } ?: 0
    val peakHR = valid[peakIndex].heartRate
    val peakTs = valid[peakIndex].timestamp
    val maxHrValidated = validatePeak(valid, peakIndex, peakHR, peakTs)

    return DailyHR(
        avgHr = avgHr.toInt(),
        maxHr = peakHR,
        maxHrValidated = maxHrValidated,
    )
}

/**
 * Resting heart rate: minimum average HR across a sliding window.
 *
 * @param samples pairs of (heartRate, timestamp)
 * @param windowMs sliding window size (default 60s)
 */
fun calcRhr(
    samples: List<Pair<Int, Long>>,
    windowMs: Long = 60_000L,
): Int {
    val valid = samples.filter { it.first in HR_MIN..HR_MAX }
    if (valid.isEmpty()) return 0
    var minAvg = Double.MAX_VALUE
    var lo = 0
    var hrSum = 0.0
    var count = 0
    for (hi in valid.indices) {
        hrSum += valid[hi].first
        count++
        while (valid[hi].second - valid[lo].second > windowMs) {
            hrSum -= valid[lo].first
            count--
            lo++
        }
        if (count > 0) {
            val avg = hrSum / count
            if (avg < minAvg) minAvg = avg
        }
    }
    return if (minAvg == Double.MAX_VALUE) 0 else minAvg.toInt()
}

private fun validatePeak(
    records: List<R24Input>,
    peakIndex: Int,
    peakHR: Int,
    peakTs: Long,
): Boolean {
    val buildupStart = peakTs - PEAK_BUILDUP_MS
    val beforePeak = records.take(peakIndex).filter { it.timestamp >= buildupStart }
    if (beforePeak.size < 2) return false
    val builtUp = beforePeak.zipWithNext().all { (a, b) -> b.heartRate >= a.heartRate }
    if (!builtUp) return false

    var sustainedMs = 0L
    for (i in peakIndex until records.size - 1) {
        if (abs(records[i].heartRate - peakHR) <= PEAK_SUSTAINED_TOLERANCE) {
            sustainedMs += records[i + 1].timestamp - records[i].timestamp
        } else {
            break
        }
        if (sustainedMs >= PEAK_SUSTAINED_MS) break
    }
    if (sustainedMs < PEAK_SUSTAINED_MS) return false

    val declineEnd = peakTs + PEAK_SUSTAINED_MS + PEAK_DECLINE_MS
    val afterPeak = records.drop(peakIndex + 1).filter { it.timestamp <= declineEnd }
    if (afterPeak.size < 2) return false
    return afterPeak.zipWithNext().all { (a, b) -> b.heartRate <= a.heartRate }
}
