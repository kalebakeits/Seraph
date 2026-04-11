package com.seraph.native.aggregation.workout

import com.seraph.native.db.R24
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb

internal class ActivityRowHandlerFactory(
    private val db: SeraphDb,
    private val r24Dao: R24Dao,
    private val params: ActivityParams,
) {
    fun create(
        row: R24,
        active: Boolean,
        openAuto: AutoWindow?,
    ): ActivityRowHandler? =
        when {
            active && openAuto == null -> ActiveNoWindowHandler(db, params)
            active -> ActiveWithWindowHandler(db, openAuto!!)
            openAuto != null && row.timestamp - openAuto.lastEndTs > MERGE_GAP_MS ->
                GapExceededHandler(
                    db,
                    r24Dao,
                    openAuto,
                )
            else -> null
        }
}
