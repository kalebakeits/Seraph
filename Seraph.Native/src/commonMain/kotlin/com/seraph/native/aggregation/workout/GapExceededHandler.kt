package com.seraph.native.aggregation.workout

import com.seraph.native.db.r24.R24
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb

internal class GapExceededHandler(
    private val db: SeraphDb,
    private val r24Dao: R24Dao,
    private val openAuto: AutoWindow,
) : ActivityRowHandler {
    override fun handle(
        row: R24,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): AutoWindow? {
        openAuto.finalize(db, r24Dao, date, params, closedStartTs)
        return null
    }
}
