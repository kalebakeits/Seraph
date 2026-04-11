package com.seraph.native.aggregation.workout

import com.seraph.native.db.R24
import com.seraph.native.db.SeraphDb

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
