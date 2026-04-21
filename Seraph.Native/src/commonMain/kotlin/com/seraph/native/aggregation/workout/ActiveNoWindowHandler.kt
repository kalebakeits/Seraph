@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation.workout

import com.seraph.native.db.r24.R24
import com.seraph.native.db.SeraphDb
import kotlin.time.Clock

internal class ActiveNoWindowHandler(
    private val db: SeraphDb,
    private val params: ActivityParams,
) : ActivityRowHandler {
    override fun handle(
        row: R24,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): AutoWindow? {
        db.seraphDbQueries.insertActivityEvent(
            date = date,
            start_ts = row.timestamp,
            end_ts = row.timestamp,
            duration_minutes = 0,
            avg_hr = row.heart_rate.toDouble(),
            max_hr = row.heart_rate.toDouble(),
            steps = null,
            type = "Workout",
            hr_samples = "[]",
            zone_seconds = """{"z1":0,"z2":0,"z3":0,"z4":0,"z5":0}""",
            threshold_hr = params.fthr,
            trimp = 0.0,
            is_manual = 0,
            hr_sum = row.heart_rate.toDouble(),
            hr_count = 1,
            created_at = Clock.System.now().toEpochMilliseconds(),
        )
        // Unavoidable re-fetch: row was just inserted and we need the DB-assigned id
        return db.seraphDbQueries
            .getOpenAutoActivities(date)
            .executeAsList()
            .firstOrNull()
            ?.let { AutoWindow(it, params) }
    }
}
