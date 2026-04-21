package com.seraph.native.aggregation.workout

import co.touchlab.kermit.Logger
import com.seraph.core.calculators.ZoneSeconds
import com.seraph.core.calculators.calcTrimp
import com.seraph.core.calculators.calcZoneSeconds
import com.seraph.core.calculators.sampleHR
import com.seraph.native.aggregation.toR24Input
import com.seraph.native.db.Activity_events
import com.seraph.native.db.r24.R24
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb

private val log = Logger.withTag("RecordedWindow")

private const val HR_SAMPLE_MAX_POINTS = 200L

/**
 * Finalizer for is_manual = 2 (app-recorded) activities.
 *
 * The recording manager captures HR samples in a binary file during the workout.
 * Those samples are converted to synthetic R24 rows and passed here directly —
 * no R24Dao fetch, no auto-detection overlap checks, no min-duration discard
 * (the user explicitly started and stopped the recording).
 */
internal class RecordedWindow(
    override val row: Activity_events,
    private val syntheticRows: List<R24>,
) : ActivityWindow {
    override val lastEndTs: Long get() = row.end_ts

    override fun onRow(
        r24: R24,
        db: SeraphDb,
    ) {
        // Recorded windows don't accumulate row-by-row — metrics computed at finalize
    }

    override fun zones(): ZoneSeconds = ZoneSeconds(0, 0, 0, 0, 0) // computed at finalize from synthetic rows

    override fun finalize(
        db: SeraphDb,
        r24Dao: R24Dao,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): Boolean {
        val inputs = syntheticRows.map { it.toR24Input() }

        val durationMs = row.end_ts - row.start_ts
        val bucketMs = if (durationMs > 0) (durationMs / HR_SAMPLE_MAX_POINTS).coerceAtLeast(1_000L) else 15_000L
        val hrSamples = sampleHR(inputs, bucketMs)
        val zones = calcZoneSeconds(inputs, params.fthr)
        val trimp = calcTrimp(inputs, params.rhr, params.maxHrForTrimp)

        val validHr = inputs.filter { it.heartRate in 30..220 }
        val avgHr = if (validHr.isNotEmpty()) validHr.map { it.heartRate }.average() else 0.0
        val maxHr = if (validHr.isNotEmpty()) validHr.maxOf { it.heartRate }.toDouble() else 0.0

        db.seraphDbQueries.updateActivityAccumulators(
            end_ts = row.end_ts,
            hr_sum = avgHr * validHr.size - row.hr_sum,
            hr_count = validHr.size.toLong() - row.hr_count,
            max_hr = maxHr,
            hr_samples = hrSamples,
            zone_seconds = zones.toJson(),
            trimp = trimp - (row.trimp ?: 0.0),
            id = row.id,
        )
        db.seraphDbQueries.markActivityFinalized(row.id)

        val isFirstClose = closedStartTs.isEmpty()
        TrainingLoadCalculator.update(db, date, trimp, isFirstWorkout = isFirstClose)
        closedStartTs.add(row.start_ts)
        log.d { "$date: finalized recorded activity ${row.id}" }
        return true
    }
}
