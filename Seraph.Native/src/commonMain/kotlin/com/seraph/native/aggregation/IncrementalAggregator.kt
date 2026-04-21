@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation

import co.touchlab.kermit.Logger
import com.seraph.core.calculators.calculateHR
import com.seraph.core.calculators.calculateSteps
import com.seraph.core.calculators.calculateStrain
import com.seraph.core.calculators.getMaxHR
import com.seraph.native.aggregation.sleep.SleepNeedCalculator
import com.seraph.native.db.AggregationDao
import com.seraph.native.db.r24.R24
import com.seraph.native.db.SeraphDb
import kotlin.math.roundToInt
import kotlin.time.Clock

private val log = Logger.withTag("IncrementalAggregator")

class IncrementalAggregator(
    private val aggDao: AggregationDao,
    private val db: SeraphDb,
) {
    fun run(
        date: String,
        rows: List<R24>,
        strategy: IAggregationStrategy,
        profile: AggregationProfile,
    ) {
        if (rows.isEmpty()) return

        val records = rows.map { it.toR24Input() }
        val newLastAggTs = rows.last().timestamp

        val hr = calculateHR(records)
        val strain = calculateStrain(records, profile.age, profile.baselineRhr?.toInt(), strategy.storedStrain(date))
        val steps = calculateSteps(records)

        val maxHR = profile.baselineMaxHr?.toInt() ?: getMaxHR(profile.age)
        val rhrForActive = profile.baselineRhr ?: 50.0
        val activeThreshold = rhrForActive + (maxHR - rhrForActive) * 0.50

        val sleepEvent =
            db.seraphDbQueries
                .querySleepByDate(date)
                .executeAsList()
                .filter { it.is_manual == 0L && it.sleep_edited == 0L }
                .maxByOrNull { it.duration_minutes }

        val wakeRecords =
            if (sleepEvent != null) {
                records.filter { it.timestamp < sleepEvent.start_ts || it.timestamp > sleepEvent.end_ts }
            } else {
                records
            }

        var activeSeconds = 0.0
        for (i in 1 until wakeRecords.size) {
            if (wakeRecords[i].heartRate >= activeThreshold) {
                val gap = (wakeRecords[i].timestamp - wakeRecords[i - 1].timestamp) / 1000.0
                if (gap in 0.0..60.0) activeSeconds += gap
            }
        }
        val activeMinutes = (activeSeconds / 60).roundToInt()
        val hrSamples = records.count { it.heartRate in 30..220 }.toLong()
        val sleepNeedResult = SleepNeedCalculator(db).calculate(date)

        aggDao.upsertIncremental(
            date = date,
            steps = steps.steps.toLong(),
            avgHr = hr.avgHr.toDouble(),
            hrSampleCount = hrSamples,
            maxHr = hr.maxHr.toDouble(),
            maxHrValidated = if (hr.maxHrValidated) 1L else 0L,
            strain = strain.score,
            activeMinutes = activeMinutes.toLong(),
            sleepNeed = sleepNeedResult.totalMinutes,
            sleepDebtAdj = sleepNeedResult.debtAdjMinutes,
            sleepStrainAdj = sleepNeedResult.strainAdjMinutes,
            lastAggTs = newLastAggTs,
            updatedAt = Clock.System.now().toEpochMilliseconds(),
        )

        log.i { "$date: incremental aggregation complete" }
    }
}
