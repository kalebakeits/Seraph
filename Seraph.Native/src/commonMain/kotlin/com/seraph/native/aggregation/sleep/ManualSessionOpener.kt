package com.seraph.native.aggregation.sleep

import com.seraph.native.db.R24
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events

/**
 * Opens a fixed (edited or manually logged) sleep session when a row falls within
 * its user-defined start/end window.
 *
 * Fixed sessions already exist in the DB — this opener finds the matching one
 * and returns it. No insertion occurs.
 */
internal class ManualSessionOpener(
    private val db: SeraphDb,
) : ISleepSessionOpener {
    override fun tryOpen(
        row: R24,
        date: String,
        openSessions: List<Sleep_events>,
    ): Sleep_events? {
        val alreadyOpenIds =
            openSessions
                .filter { it.sleep_edited > 0L || it.is_manual > 0L }
                .map { it.id }
                .toSet()

        return db.seraphDbQueries
            .getOpenEditedSleep(date)
            .executeAsList()
            .firstOrNull { it.id !in alreadyOpenIds && row.timestamp in it.start_ts..it.end_ts }
    }
}
