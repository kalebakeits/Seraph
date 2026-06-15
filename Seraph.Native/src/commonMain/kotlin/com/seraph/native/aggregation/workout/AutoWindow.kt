package com.seraph.native.aggregation.workout

import co.touchlab.kermit.Logger
import com.seraph.core.calculators.ZoneSeconds
import com.seraph.native.db.Activity_events
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.r24.R24

private val log = Logger.withTag("AutoWindow")

internal class AutoWindow(
    override val row: Activity_events,
    private val params: ActivityParams,
) : ActivityWindow {
    override var lastEndTs: Long = row.end_ts
        private set

    private val accumulator =
        TrimpAccumulator(params, row.id).also {
            if (row.end_ts > row.start_ts) it.seedPrevTs(row.end_ts)
        }

    override fun onRow(
        r24: R24,
        db: SeraphDb,
    ) {
        accumulator.onRow(r24, db)
        lastEndTs = r24.timestamp
    }

    override fun zones(): ZoneSeconds = accumulator.zones()

    override fun finalize(
        db: SeraphDb,
        r24Dao: R24Dao,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): Boolean {
        val windowMs = lastEndTs - row.start_ts
        if (windowMs < params.minActivityMs) {
            log.d { "$date: discarding short auto activity ${windowMs / 60000}min" }
            db.seraphDbQueries.deleteActivityById(row.id)
            return false
        }
        val overlapsManual = db.seraphDbQueries.hasManualOverlapRange(date, lastEndTs, row.start_ts).executeAsOne() > 0
        if (overlapsManual) {
            log.d { "$date: discarding auto activity ${row.id} — overlaps manual" }
            db.seraphDbQueries.deleteActivityById(row.id)
            return false
        }
        return finalizeMetrics(db, r24Dao, date, params, closedStartTs)
    }
}
