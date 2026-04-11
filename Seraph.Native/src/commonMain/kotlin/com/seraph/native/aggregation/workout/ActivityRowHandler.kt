package com.seraph.native.aggregation.workout

import com.seraph.native.db.R24

internal interface ActivityRowHandler {
    /** Returns updated openAuto (may be newly created or nulled after close). */
    fun handle(
        row: R24,
        date: String,
        params: ActivityParams,
        closedStartTs: MutableList<Long>,
    ): AutoWindow?
}
