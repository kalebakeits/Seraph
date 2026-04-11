package com.seraph.native.aggregation

import co.touchlab.kermit.Logger
import com.seraph.native.db.AggregationDao
import com.seraph.native.db.SeraphDb

private val log = Logger.withTag("BaselineCalculator")

class BaselineCalculator(
    private val aggDao: AggregationDao,
    private val db: SeraphDb,
) {
    fun run() {
        val since = DateUtils.dateStringDaysAgo(30)
        val today = DateUtils.todayDateString()
        val rows = aggDao.queryRange(since, today)
        if (rows.isEmpty()) return

        val rhrs = rows.mapNotNull { it.rhr }.sorted()
        val hrvs = rows.mapNotNull { it.hrv_rmssd }.sorted()

        val median = { arr: List<Double> -> if (arr.isEmpty()) null else arr[arr.size / 2] }

        val baselineRhr = median(rhrs)
        val baselineHrv = median(hrvs)

        if (baselineHrv != null || baselineRhr != null) {
            db.seraphDbQueries.updateDailyBaselines(
                baseline_hrv = baselineHrv,
                baseline_rhr = baselineRhr,
                date = today,
            )
        }

        log.i { "Baselines recomputed from ${rows.size} days" }
    }
}
