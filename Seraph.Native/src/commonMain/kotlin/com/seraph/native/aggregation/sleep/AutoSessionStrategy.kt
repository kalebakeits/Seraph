package com.seraph.native.aggregation.sleep

import com.seraph.core.calculators.isSleepByte
import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.r24.R24
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events

/**
 * Processes rows for an auto-detected sleep session.
 *
 * Extends end_ts on each sleeping row. On a non-sleeping row, tracks the awake
 * gap via pending_awake_ms. Closes when the gap exceeds [MERGE_GAP_MS].
 *
 * Before finalizing, checks for overlap with any finalized session (manual,
 * edited, or another auto). If overlap exists, deletes this session instead.
 */
internal class AutoSessionStrategy(
    private val db: SeraphDb,
    private val closer: SleepWindowCloser,
) : ISleepSessionStrategy {
    // Tracks the live end_ts as extendSleep advances it in the DB.
    // session.end_ts is a stale snapshot from when the session was loaded.
    private var currentEndTs: Long? = null

    override fun extend(
        session: Sleep_events,
        row: R24,
        date: String,
        profile: AggregationProfile,
    ): RowResult {
        if (currentEndTs == null) currentEndTs = session.end_ts

        if (isSleepByte(row.b80.toInt())) {
            val accum = accumRow(row)
            db.seraphDbQueries.extendSleep(
                end_ts = row.timestamp,
                hr_sum = accum.hrSum,
                hr_count = accum.hrCount,
                hrv_sq_sum = accum.hrvSqSum,
                hrv_count = accum.hrvCount,
                skin_temp_sum = row.skin_temp,
                skin_temp_count = 1,
                id = session.id,
            )
            currentEndTs = row.timestamp
            return RowResult.EXTENDED
        }

        val endTs = currentEndTs!!

        // Non-sleeping row — check if gap has exceeded the merge threshold
        if (row.timestamp - endTs > MERGE_GAP_MS) {
            if (hasOverlap(session)) {
                db.seraphDbQueries.deleteSleepById(session.id)
            } else {
                val fresh = db.seraphDbQueries.getSleepById(session.id).executeAsOneOrNull() ?: session
                closer.close(fresh, date, profile)
            }
            return RowResult.CLOSED
        }

        db.seraphDbQueries.setPendingAwake(
            awake_ms = row.timestamp - endTs,
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
        val endTs = currentEndTs ?: session.end_ts
        if (lastTs - endTs > MERGE_GAP_MS) {
            if (hasOverlap(session)) {
                db.seraphDbQueries.deleteSleepById(session.id)
                return null
            }
            val fresh = db.seraphDbQueries.getSleepById(session.id).executeAsOneOrNull() ?: session
            return closer.close(fresh, date, profile)
        }
        return null
    }

    private fun hasOverlap(session: Sleep_events): Boolean =
        db.seraphDbQueries
            .hasSleepOverlapRange(
                excludeId = session.id,
                end_ts = currentEndTs ?: session.end_ts,
                start_ts = session.start_ts,
            ).executeAsOne() > 0L
}
