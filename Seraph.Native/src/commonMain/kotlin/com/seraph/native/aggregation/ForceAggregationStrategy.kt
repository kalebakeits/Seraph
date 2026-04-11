@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation

import com.seraph.native.db.SeraphDb
import kotlin.time.Clock

class ForceAggregationStrategy(
    private val db: SeraphDb,
) : IAggregationStrategy {
    override fun prepare(dates: List<String>) {
        if (dates.isEmpty()) return
        db.seraphDbQueries.clearLastAggTsRange(dates.first(), dates.last())
    }

    override fun prepareDate(date: String) {
        val now = Clock.System.now().toEpochMilliseconds()
        db.seraphDbQueries.resetDailyAggregationForDate(updated_at = now, date = date)
        db.seraphDbQueries.clearDailyTrainingLoad(date)
        // Auto sessions are deleted — they will be re-detected from scratch.
        db.seraphDbQueries
            .querySleepByDate(date)
            .executeAsList()
            .filter { it.sleep_edited == 0L && it.is_manual == 0L }
            .forEach { db.seraphDbQueries.deleteSleepById(it.id) }
        // Manual/edited sessions keep their timestamps but have accumulators zeroed
        // so HR/HRV/scores are recomputed cleanly without double-counting.
        db.seraphDbQueries.resetManualSleepForDate(date)
        db.seraphDbQueries.deleteAutoActivitiesForDate(date)
        db.seraphDbQueries.resetManualActivitiesForDate(date)
    }

    override fun storedStrain(date: String): Double = 0.0
}
