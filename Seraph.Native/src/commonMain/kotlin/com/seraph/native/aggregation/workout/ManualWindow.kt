package com.seraph.native.aggregation.workout

import com.seraph.core.calculators.ZoneSeconds
import com.seraph.native.db.Activity_events
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.r24.R24

internal class ManualWindow(
    override val row: Activity_events,
    private val params: ActivityParams,
) : ActivityWindow {
    override val lastEndTs: Long get() = row.end_ts

    private val accumulator = TrimpAccumulator(params, row.id)

    override fun onRow(
        r24: R24,
        db: SeraphDb,
    ) {
        accumulator.onRow(r24, db)
    }

    override fun zones(): ZoneSeconds = accumulator.zones()

    override fun finalize(
        db: SeraphDb,
        r24Dao: R24Dao,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): Boolean = finalizeMetrics(db, r24Dao, date, params, closedStartTs)
}
