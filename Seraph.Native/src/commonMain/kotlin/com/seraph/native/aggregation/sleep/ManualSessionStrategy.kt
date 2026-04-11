package com.seraph.native.aggregation.sleep

import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.R24
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events

/**
 * Processes rows for a fixed (edited or manually logged) sleep session.
 *
 * The window boundaries are locked — end_ts is never extended. Rows within
 * [start_ts, end_ts] accumulate HR, HRV, and awake time identically to the
 * auto strategy. Rows outside the window are out of scope.
 *
 * Closes as soon as R24 data has reached or passed end_ts — the boundary is
 * explicit so no merge gap heuristic is needed.
 */
internal class ManualSessionStrategy(
    private val db: SeraphDb,
    private val closer: SleepWindowCloser,
) : ISleepSessionStrategy {
    override fun extend(
        session: Sleep_events,
        row: R24,
        date: String,
        profile: AggregationProfile,
    ): RowResult {
        if (row.timestamp !in session.start_ts..session.end_ts) {
            // Past the fixed window — time to close
            if (row.timestamp > session.end_ts) {
                closer.close(session, date, profile)
                return RowResult.CLOSED
            }
            return RowResult.OUT_OF_SCOPE
        }

        // For manual/edited sessions the user has declared the window — accumulate all rows
        // regardless of b80 sleep classification.
        val accum = accumRow(row)
        db.seraphDbQueries.accumulateEditedSleep(
            hr_sum = accum.hrSum,
            hr_count = accum.hrCount,
            hrv_sq_sum = accum.hrvSqSum,
            hrv_count = accum.hrvCount,
            skin_temp_sum = row.skin_temp,
            skin_temp_count = 1,
            id = session.id,
        )
        return RowResult.EXTENDED
    }

    override fun concludeIfReady(
        session: Sleep_events,
        lastTs: Long,
        date: String,
        profile: AggregationProfile,
    ): Long? {
        if (lastTs >= session.end_ts) {
            return closer.close(session, date, profile)
        }
        return null
    }
}
