package com.seraph.native.aggregation.workout

import com.seraph.native.db.SeraphDb
import com.seraph.native.db.r24.R24

internal class ActiveWithWindowHandler(
    private val db: SeraphDb,
    private val openAuto: AutoWindow,
) : ActivityRowHandler {
    override fun handle(
        row: R24,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): AutoWindow {
        openAuto.onRow(row, db)
        return openAuto
    }
}
