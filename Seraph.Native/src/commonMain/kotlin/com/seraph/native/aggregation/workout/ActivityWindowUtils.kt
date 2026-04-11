package com.seraph.native.aggregation.workout

import co.touchlab.kermit.Logger
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb

private val log = Logger.withTag("ActivityWindow")

private const val HR_SAMPLE_MAX_POINTS = 200L

internal fun ActivityWindow.finalizeMetrics(
    db: SeraphDb,
    r24Dao: R24Dao,
    date: String,
    params: ActivityParams,
    closedStartTs: MutableList<Long>,
): Boolean {
    // Reload accumulators — hr_sum/hr_count/trimp accumulated incrementally via updateActivityAccumulators
    val current = db.seraphDbQueries.getActivityById(row.id).executeAsOneOrNull() ?: return false
    val trimp = current.trimp ?: 0.0

    if (row.is_manual == 0L && trimp < params.minActivityTrimp) {
        log.d { "$date: discarding low-intensity activity" }
        db.seraphDbQueries.deleteActivityById(row.id)
        return false
    }

    val durationMs = lastEndTs - row.start_ts
    val bucketMs = if (durationMs > 0) (durationMs / HR_SAMPLE_MAX_POINTS).coerceAtLeast(1_000L) else 15_000L
    val hrBuckets = r24Dao.sampleHrBuckets(row.start_ts, lastEndTs, bucketMs)
    val hrSamples =
        if (hrBuckets.isEmpty()) {
            "[]"
        } else {
            "[${hrBuckets.joinToString(",") { """{"t":${it.bucket_start},"hr":${it.avg_hr}}""" }}]"
        }

    val zoneJson = zones().toJson()

    db.seraphDbQueries.updateActivityAccumulators(
        end_ts = lastEndTs,
        hr_sum = 0.0,
        hr_count = 0L,
        max_hr = current.max_hr ?: 0.0,
        hr_samples = hrSamples,
        zone_seconds = zoneJson,
        trimp = 0.0,
        id = row.id,
    )
    db.seraphDbQueries.markActivityFinalized(row.id)

    val isFirstClose = closedStartTs.isEmpty()
    TrainingLoadCalculator.update(db, date, trimp, isFirstWorkout = isFirstClose)
    closedStartTs.add(row.start_ts)
    log.d { "$date: finalized activity ${row.id}" }
    return true
}
