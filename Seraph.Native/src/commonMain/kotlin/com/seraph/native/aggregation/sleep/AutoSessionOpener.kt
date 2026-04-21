@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation.sleep

import com.seraph.core.calculators.isSleepByte
import com.seraph.native.db.r24.R24
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events
import kotlin.time.Clock

/**
 * Opens a new auto-detected sleep session when a sleep byte arrives and no auto
 * session is already open.
 */
internal class AutoSessionOpener(
    private val db: SeraphDb,
) : ISleepSessionOpener {
    override fun tryOpen(
        row: R24,
        date: String,
        openSessions: List<Sleep_events>,
    ): Sleep_events? {
        if (!isSleepByte(row.b80.toInt())) return null
        val alreadyOpen = openSessions.any { it.sleep_edited == 0L && it.is_manual == 0L }
        if (alreadyOpen) return null

        db.seraphDbQueries.insertSleepEvent(
            date = date,
            start_ts = row.timestamp,
            end_ts = row.timestamp,
            duration_minutes = 0,
            awake_minutes = 0,
            avg_hr = null,
            hrv_rmssd = null,
            hr_samples = "[]",
            stage_samples = "[]",
            is_manual = 0,
            sleep_score = 0,
            hr_sum = 0.0,
            hr_count = 0,
            hrv_sq_sum = 0.0,
            hrv_count = 0,
            rhr_min = null,
            skin_temp_sum = 0.0,
            skin_temp_count = 0,
            created_at = Clock.System.now().toEpochMilliseconds(),
        )
        return db.seraphDbQueries.getOpenSleep(date).executeAsOneOrNull()
    }
}
