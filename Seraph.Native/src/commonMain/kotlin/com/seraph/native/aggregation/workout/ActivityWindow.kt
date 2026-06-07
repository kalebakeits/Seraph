package com.seraph.native.aggregation.workout

import com.seraph.core.calculators.ZoneSeconds
import com.seraph.native.db.Activity_events
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.r24.R24

internal interface ActivityWindow {
    val row: Activity_events

    /** The latest end timestamp seen — may differ from row.end_ts which is a stale snapshot. */
    val lastEndTs: Long

    /** Called on every active R24 row while this window is open. Accumulates trimp, zones, HR. */
    fun onRow(
        r24: R24,
        db: SeraphDb,
    )

    /** Returns accumulated zone seconds. */
    fun zones(): ZoneSeconds

    /** Write final hr_samples + zone_seconds blobs and mark finalized. Returns false if discarded. */
    fun finalize(
        db: SeraphDb,
        r24Dao: R24Dao,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): Boolean
}
