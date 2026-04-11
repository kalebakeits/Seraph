package com.seraph.native.aggregation.sleep

import com.seraph.native.db.R24
import com.seraph.native.db.Sleep_events

/**
 * Determines whether a new sleep session should be opened for the given row,
 * and inserts it into the DB if so.
 *
 * Each implementation handles one session type (auto-detected or fixed/manual).
 * The caller is responsible for checking that no session of this type is already open.
 */
internal interface ISleepSessionOpener {
    /**
     * Returns a newly opened session if this row warrants one, null otherwise.
     * The returned session has already been persisted to the DB.
     */
    fun tryOpen(
        row: R24,
        date: String,
        openSessions: List<Sleep_events>,
    ): Sleep_events?
}
