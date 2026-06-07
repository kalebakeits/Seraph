@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation.sleep

import co.touchlab.kermit.Logger
import com.seraph.core.calculators.calcSleepScore
import com.seraph.core.calculators.calculateRecovery
import com.seraph.core.calculators.parseRr
import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.AggregationDao
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events
import com.seraph.native.db.r24.R24
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.sqrt
import kotlin.time.Clock

private val log = Logger.withTag("SleepWindowCloser")

private const val HR_SAMPLE_COUNT = 200

internal data class RowAccum(
    val hrSum: Double,
    val hrCount: Long,
    val hrvSqSum: Double,
    val hrvCount: Long,
)

internal fun accumRow(row: R24): RowAccum {
    val hrValid = row.heart_rate in 30..220
    val hrSum = if (hrValid) row.heart_rate.toDouble() else 0.0
    val hrCount = if (hrValid) 1L else 0L

    var hrvSqSum = 0.0
    var hrvCount = 0L
    val rr = parseRr(row.rr_intervals)
    if (rr.size >= 2) {
        for (i in 1 until rr.size) {
            val diff = (rr[i] - rr[i - 1]).toDouble()
            if (abs(diff) <= MAX_RR_DIFF) {
                hrvSqSum += diff * diff
                hrvCount++
            }
        }
    }

    return RowAccum(hrSum, hrCount, hrvSqSum, hrvCount)
}

class SleepWindowCloser(
    private val db: SeraphDb,
    private val aggDao: AggregationDao,
    private val r24Dao: R24Dao,
) {
    fun close(
        open: Sleep_events,
        date: String,
        profile: AggregationProfile,
    ): Long? {
        val windowMs = open.end_ts - open.start_ts
        val isEdited = open.sleep_edited > 0 || open.is_manual > 0
        if (!isEdited && windowMs < MIN_SLEEP_MS) {
            log.d { "$date: discarding short sleep ${windowMs / 60000}min" }
            db.seraphDbQueries.deleteSleepById(open.id)
            return null
        }

        val hrSamples = buildHrSamples(open.start_ts, open.end_ts)
        val stageSamples = buildStageSamples()

        val awakeMinutes = open.awake_minutes.toInt()
        val totalMinutes = (windowMs / 60000.0).roundToInt()
        val durationMin = (totalMinutes - awakeMinutes).coerceAtLeast(0)

        val computedNeed =
            db.seraphDbQueries
                .queryAggregationRange(date, date)
                .executeAsList()
                .firstOrNull()
                ?.sleep_need
                ?.roundToInt()
        val sleepNeedMin = computedNeed ?: profile.sleepGoalMinutes
        val sleepScore = calcSleepScore(durationMin, sleepNeedMin)

        db.seraphDbQueries.finalizeSleepValues(
            hr_samples = hrSamples,
            stage_samples = stageSamples,
            sleep_score = sleepScore.toLong(),
            awake_minutes = awakeMinutes.toLong(),
            duration_minutes = durationMin.toLong(),
            id = open.id,
        )

        // Reload so rmssd/skinTemp use accumulators written during this recalc pass,
        // not the stale values from the session object loaded before replay.
        val fresh = db.seraphDbQueries.getSleepById(open.id).executeAsOneOrNull() ?: open
        val rmssd = if (fresh.hrv_count > 0) sqrt(fresh.hrv_sq_sum / fresh.hrv_count) else 0.0
        val rhr = r24Dao.calcRhrForWindow(open.start_ts, open.end_ts)
        val skinTemp = if (fresh.skin_temp_count > 0) fresh.skin_temp_sum / fresh.skin_temp_count else null

        db.seraphDbQueries.markSleepFinalized(hrv_rmssd = rmssd, id = open.id)

        // Only write recovery for the primary sleep (first to end on this date).
        // Any sleep that ends after an already-finalized sleep is a nap — skip recovery.
        val earliestFinalizedEndTs =
            db.seraphDbQueries
                .getEarliestFinalizedSleep(date)
                .executeAsOneOrNull()
        val isPrimary = earliestFinalizedEndTs == null || open.end_ts <= earliestFinalizedEndTs

        var recoveryScore: Int? = null
        if (isPrimary) {
            val (baselineHrv, baselineRhr) = aggDao.getLatestWithBaselines()
            val recovery =
                calculateRecovery(
                    rmssd = rmssd,
                    rhr = rhr.toDouble(),
                    sleepScore = sleepScore,
                    baselineHrv = baselineHrv,
                    baselineRhr = baselineRhr,
                )
            recoveryScore = recovery.score
            aggDao.finalize(
                date = date,
                rhr = rhr.toDouble(),
                hrvRmssd = rmssd,
                recovery = recovery.score.toDouble(),
                skinTemp = skinTemp,
                sleepNeed = sleepNeedMin.toDouble(),
                updatedAt = Clock.System.now().toEpochMilliseconds(),
            )
        }

        log.i { "$date: sleep closed ${durationMin}min (awake=${awakeMinutes}min)" }
        return open.start_ts
    }

    private fun buildHrSamples(
        startMs: Long,
        endMs: Long,
    ): String {
        val durationMs = endMs - startMs
        val bucketMs = if (durationMs > 0) (durationMs / HR_SAMPLE_COUNT).coerceAtLeast(1_000L) else 60_000L
        val buckets = r24Dao.sampleHrBuckets(startMs, endMs, bucketMs)
        if (buckets.isEmpty()) return "[]"
        val json = buckets.joinToString(",") { """{"t":${it.bucket_start},"hr":${it.avg_hr}}""" }
        return "[$json]"
    }

    // TODO: sleep stage classification from HR+RMSSD per 5-min bucket.
    // Needs a validated model — rules-based thresholds are not accurate enough.
    // Data is available: rrIntervalsInRange + sampleHrBuckets queries exist.
    // Reference baselines: aggDao.getLatestWithBaselines() → (baselineHrv, baselineRhr).
    private fun buildStageSamples(): String = "[]"
}
