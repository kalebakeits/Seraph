@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation.workout

import co.touchlab.kermit.Logger
import com.seraph.core.calculators.getMaxHR
import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.R24
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb

private val log = Logger.withTag("ActivityAggregator")

class ActivityAggregator(
    private val db: SeraphDb,
    private val r24Dao: R24Dao,
) {
    /** Returns start_ts of newly closed sessions. */
    fun run(
        date: String,
        rows: List<R24>,
        profile: AggregationProfile,
    ): List<Long> {
        if (rows.isEmpty()) return emptyList()

        val maxHR = profile.baselineMaxHr?.toInt() ?: getMaxHR(profile.age)
        val rhrForActive = profile.baselineRhr ?: 55.0
        val thresholdHR = rhrForActive + (maxHR - rhrForActive) * 0.30
        val params =
            ActivityParams(
                fthr = profile.thresholdHr ?: ((220 - (profile.age ?: 30)) * 0.85),
                rhr = profile.baselineRhr ?: 55.0,
                maxHrForTrimp = profile.baselineMaxHr ?: (220.0 - (profile.age ?: 30)),
                minActivityMs = maxOf(profile.activityMinMs, MIN_ACTIVITY_MS_FLOOR),
                minActivityTrimp = profile.activityMinTrimp,
            )

        // Prefetch all open windows — only re-fetch openAuto after insert (unavoidable)
        var openAuto: AutoWindow? =
            db.seraphDbQueries.getOpenAutoActivities(date).executeAsList().firstOrNull()?.let {
                AutoWindow(it, params)
            }
        val openManuals: MutableList<ManualWindow> =
            db.seraphDbQueries
                .getOpenManualActivities(date)
                .executeAsList()
                .map { ManualWindow(it, params) }
                .toMutableList()

        val handlerFactory = ActivityRowHandlerFactory(db, r24Dao, params)
        val closedStartTs = mutableListOf<Long>()

        for (row in rows) {
            openManuals
                .filter { row.timestamp > it.row.end_ts - MANUAL_CLOSE_TOLERANCE_MS }
                .also { toClose -> toClose.forEach { it.finalize(db, r24Dao, date, params, closedStartTs) } }
                .let { toClose -> openManuals.removeAll(toClose) }

            openManuals
                .filter { row.timestamp in it.row.start_ts..it.row.end_ts }
                .forEach { it.onRow(row, db) }

            if (openManuals.any { row.timestamp in it.row.start_ts..it.row.end_ts }) continue

            val active = row.heart_rate in 30..220 && row.heart_rate >= thresholdHR.toLong()
            val handler = handlerFactory.create(row, active, openAuto) ?: continue
            openAuto = handler.handle(row, date, params, closedStartTs)
        }

        val lastTs = rows.last().timestamp

        openManuals
            .filter { lastTs > it.row.end_ts - MANUAL_CLOSE_TOLERANCE_MS }
            .forEach { it.finalize(db, r24Dao, date, params, closedStartTs) }

        if (openAuto != null && lastTs - openAuto.lastEndTs > MERGE_GAP_MS) {
            openAuto.finalize(db, r24Dao, date, params, closedStartTs)
        }

        if (closedStartTs.isNotEmpty()) log.i { "$date: closed ${closedStartTs.size} workout(s)" }
        return closedStartTs
    }
}
