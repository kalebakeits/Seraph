package com.seraph.core.calculators

import com.seraph.core.model.DailyStrain
import com.seraph.core.model.R24Input
import kotlin.math.exp

private data class Zone(
    val min: Double,
    val max: Double,
    val weight: Double,
)

private val ZONES =
    listOf(
        Zone(0.0, 0.50, 0.0),
        Zone(0.50, 0.60, 1.0),
        Zone(0.60, 0.70, 2.0),
        Zone(0.70, 0.85, 4.0),
        Zone(0.85, 1.00, 7.0),
    )

private const val CURVE_K = 12000.0
private const val MAX_STRAIN = 21.0

fun calculateStrain(
    records: List<R24Input>,
    age: Int? = null,
    rhr: Int? = null,
    previousStrain: Double = 0.0,
): DailyStrain {
    if (records.size < 2) return DailyStrain(previousStrain)

    val maxHR = getMaxHR(age)

    val effectiveRhr: Int =
        rhr ?: run {
            val hrs = records.map { it.heartRate }.filter { it in 31..219 }.sorted()
            if (hrs.isEmpty()) 55 else hrs[(hrs.size * 0.1).toInt()]
        }

    val hrRange = maxHR - effectiveRhr
    if (hrRange <= 0) return DailyStrain(previousStrain)

    // Back-calculate accumulated weighted seconds from stored strain so we can
    // continue accumulating incrementally without loading full-day rows.
    val prevWeightedSeconds =
        if (previousStrain > 0.0 && previousStrain < MAX_STRAIN) {
            -CURVE_K * Math.log(1.0 - previousStrain / MAX_STRAIN)
        } else {
            0.0
        }

    var deltaWeightedSeconds = 0.0

    for (i in 1 until records.size) {
        val hr = records[i].heartRate
        if (hr !in 30..220 || hr < effectiveRhr) continue

        val hrrFraction = (hr - effectiveRhr).toDouble() / hrRange
        val intervalSec = (records[i].timestamp - records[i - 1].timestamp) / 1000.0
        if (intervalSec <= 0 || intervalSec > 60) continue

        for (zone in ZONES) {
            if (hrrFraction >= zone.min && hrrFraction < zone.max) {
                deltaWeightedSeconds += intervalSec * zone.weight
                break
            }
        }
    }

    val score = MAX_STRAIN * (1.0 - exp(-(prevWeightedSeconds + deltaWeightedSeconds) / CURVE_K))
    return DailyStrain((score * 10).toLong() / 10.0)
}
