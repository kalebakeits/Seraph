package com.seraph.native.db

import com.seraph.native.aggregation.DateUtils

class AggregationDao(
    private val db: SeraphDb,
) {
    fun upsertIncremental(
        date: String,
        steps: Long,
        avgHr: Double,
        hrSampleCount: Long,
        maxHr: Double,
        maxHrValidated: Long,
        strain: Double,
        activeMinutes: Long,
        sleepNeed: Double?,
        sleepNeedFactors: String?,
        lastAggTs: Long?,
        updatedAt: Long,
    ) {
        db.seraphDbQueries.insertIncrementalAggregationIfMissing(
            date = date,
            last_agg_ts = lastAggTs,
            updated_at = updatedAt,
        )
        db.seraphDbQueries.updateIncrementalAggregation(
            steps = steps,
            avg_hr = avgHr,
            hr_sample_count = hrSampleCount.toDouble(),
            max_hr = maxHr,
            max_hr_validated = maxHrValidated,
            strain = strain,
            active_minutes = activeMinutes,
            sleep_need = sleepNeed,
            sleep_need_factors = sleepNeedFactors,
            last_agg_ts = lastAggTs,
            updated_at = updatedAt,
            date = date,
        )
    }

    fun finalize(
        date: String,
        rhr: Double?,
        hrvRmssd: Double?,
        recovery: Double?,
        skinTemp: Double?,
        sleepNeed: Double?,
        updatedAt: Long,
    ) {
        db.seraphDbQueries.finalizeDailyAggregation(
            rhr = rhr,
            hrv_rmssd = hrvRmssd,
            recovery = recovery,
            skin_temp = skinTemp,
            sleep_need = sleepNeed,
            updated_at = updatedAt,
            date = date,
        )
    }

    fun getLastAggTs(date: String): Long? =
        db.seraphDbQueries
            .getLastAggTs(date)
            .executeAsOneOrNull()
            ?.last_agg_ts

    fun markFinalized(date: String) = db.seraphDbQueries.markAggregationFinalized(date)

    fun queryRange(
        since: String,
        until: String,
    ) = db.seraphDbQueries.queryAggregationRange(since, until).executeAsList()

    fun getLatestWithBaselines(): Pair<Double?, Double?> {
        val rows =
            db.seraphDbQueries
                .queryAggregationRange(
                    DateUtils.dateStringDaysAgo(90),
                    DateUtils.todayDateString(),
                ).executeAsList()
        val latest = rows.lastOrNull { it.baseline_hrv != null || it.baseline_rhr != null }
        return Pair(latest?.baseline_hrv, latest?.baseline_rhr)
    }
}
