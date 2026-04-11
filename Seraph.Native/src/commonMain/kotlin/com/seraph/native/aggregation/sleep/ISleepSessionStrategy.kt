package com.seraph.native.aggregation.sleep

import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.R24
import com.seraph.native.db.Sleep_events

/**
 * Handles row-by-row processing and finalization for a single open sleep session.
 *
 * Auto-detected and fixed (edited/manual) sessions share the same accumulation
 * logic but differ in how they manage the window boundary and when they close.
 */
internal interface ISleepSessionStrategy {
    /**
     * Process one R24 row against the given session.
     *
     * Returns:
     * - [RowResult.EXTENDED]    — row was in scope and accumulated
     * - [RowResult.CLOSED]      — row triggered finalization; session is now written to DB
     * - [RowResult.OUT_OF_SCOPE] — row does not belong to this session; nothing was written
     */
    fun extend(
        session: Sleep_events,
        row: R24,
        date: String,
        profile: AggregationProfile,
    ): RowResult

    /**
     * Called after all rows have been processed.
     * Finalizes the session if sufficient data has arrived, otherwise leaves it open
     * for the next incremental batch.
     * Returns the session's start_ts if finalized, null if left open.
     */
    fun concludeIfReady(
        session: Sleep_events,
        lastTs: Long,
        date: String,
        profile: AggregationProfile,
    ): Long?
}
