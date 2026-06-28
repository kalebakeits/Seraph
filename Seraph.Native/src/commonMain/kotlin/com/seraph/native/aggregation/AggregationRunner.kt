@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation

import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.DateUtils
import com.seraph.native.aggregation.hrv.AllDayHRVAggregator
import com.seraph.native.aggregation.sleep.MERGE_GAP_MS
import com.seraph.native.aggregation.sleep.SleepAggregator
import com.seraph.native.aggregation.sleep.SleepNeedCalculator
import com.seraph.native.aggregation.workout.ActivityAggregator
import com.seraph.native.aggregation.workout.TrainingLoadCalculator
import com.seraph.native.db.AggregationDao
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.r24.R24Db
import kotlinx.coroutines.sync.Mutex
import kotlin.time.Clock

class OverlapException(
    message: String,
) : Exception(message)

private val log = Logger.withTag("AggregationRunner")

data class AggregationResult(
    val newSleepStartTs: List<Long> = emptyList(),
    val activityCounts: Map<String, Int> = emptyMap(),
    val closedActivityStartTs: List<Long> = emptyList(),
    val datesProcessed: Int = 0,
)

data class AggregationProfile(
    val age: Int?,
    val thresholdHr: Double?,
    val baselineRhr: Double?,
    val baselineMaxHr: Double?,
    val sleepGoalMinutes: Int,
    val sleepGoalMode: String,
    val activityMinTrimp: Double,
    val activityMinMs: Long,
)

class AggregationRunner(
    private val db: SeraphDb,
    private val aggDao: AggregationDao,
    private val r24Dao: R24Dao,
    private val incrementalAggregator: IncrementalAggregator,
    private val sleepAggregator: SleepAggregator,
    private val activityAggregator: ActivityAggregator,
    private val allDayHRVAggregator: AllDayHRVAggregator,
    private val baselineCalculator: BaselineCalculator,
    private val strategyFactory: AggregationStrategyFactory,
) {
    private val mutex = Mutex()
    private val pendingDates = mutableSetOf<String>()
    val isRunning: Boolean get() = mutex.isLocked

    suspend fun run(
        affectedDates: List<String>,
        force: Boolean = false,
        onDateComplete: ((String) -> Unit)? = null,
    ): AggregationResult {
        if (affectedDates.isEmpty()) return AggregationResult()

        synchronized(pendingDates) { pendingDates.addAll(affectedDates) }

        if (!mutex.tryLock()) {
            log.d { "Aggregation already running — coalesced ${affectedDates.size} date(s) into next run" }
            return AggregationResult()
        }

        return try {
            var lastResult = AggregationResult()
            while (true) {
                val dates =
                    synchronized(pendingDates) {
                        pendingDates.toList().also { pendingDates.clear() }
                    }
                if (dates.isEmpty()) break
                lastResult = runInternal(dates, force, onDateComplete)
            }
            lastResult
        } finally {
            mutex.unlock()
        }
    }

    /**
     * Recalculates a single activity row from raw R24 data.
     * Throws [OverlapException] if the new window overlaps another finalized activity.
     * No-op if no R24 data exists in the window (aggregation will handle it on next sync).
     */
    fun recalcActivity(activityId: Long) {
        val activity =
            db.seraphDbQueries.getActivityById(activityId).executeAsOneOrNull()
                ?: run {
                    log.w { "recalcActivity: activity $activityId not found" }
                    return
                }

        val overlap =
            db.seraphDbQueries
                .hasActivityOverlapRange(
                    excludeId = activityId,
                    end_ts = activity.end_ts,
                    start_ts = activity.start_ts,
                ).executeAsOne()
        if (overlap > 0) throw OverlapException("OVERLAP_ACTIVITY")

        val rows = r24Dao.queryByDateRange(activity.start_ts, activity.end_ts)
        if (rows.isEmpty()) return

        val profile = loadProfile()
        activityAggregator.run(activity.date, rows, profile)

        val today = DateUtils.todayDateString()
        db.seraphDbQueries.updateDailyTrimp(
            trimp = db.seraphDbQueries.sumTrimpForDate(activity.date).executeAsOne(),
            date = activity.date,
        )
        TrainingLoadCalculator.recascade(db, activity.date, today)
    }

    /**
     * Finalizes a recorded (is_manual = 2) activity using the synthetic R24 rows
     * captured during the recording session. Bypasses the normal R24Dao fetch path.
     */
    fun finalizeRecordedActivity(
        activityId: Long,
        syntheticRows: List<com.seraph.native.db.r24.R24>,
    ) {
        val activity =
            db.seraphDbQueries.getActivityById(activityId).executeAsOneOrNull()
                ?: run {
                    log.w { "finalizeRecordedActivity: activity $activityId not found" }
                    return
                }
        val profile = loadProfile()
        val params =
            com.seraph.native.aggregation.workout.ActivityParams(
                fthr = profile.thresholdHr ?: ((220 - (profile.age ?: 30)) * 0.85),
                rhr = profile.baselineRhr ?: 55.0,
                maxHrForTrimp = profile.baselineMaxHr ?: (220.0 - (profile.age ?: 30)),
                minActivityMs = profile.activityMinMs,
                minActivityTrimp = profile.activityMinTrimp,
            )
        val window =
            com.seraph.native.aggregation.workout
                .RecordedWindow(activity, syntheticRows)
        val closed = mutableListOf<Long>()
        window.finalize(db, r24Dao, activity.date, params, closed)
        if (closed.isNotEmpty()) {
            val today = DateUtils.todayDateString()
            db.seraphDbQueries.updateDailyTrimp(
                trimp = db.seraphDbQueries.sumTrimpForDate(activity.date).executeAsOne(),
                date = activity.date,
            )
            TrainingLoadCalculator.recascade(db, activity.date, today)
        }
    }

    /**
     * Re-sums daily TRIMP from finalized activities and recascades CTL/ATL.
     * Call after deleting an activity.
     */
    fun refreshDailyLoad(date: String) {
        val today = DateUtils.todayDateString()
        db.seraphDbQueries.updateDailyTrimp(
            trimp = db.seraphDbQueries.sumTrimpForDate(date).executeAsOne(),
            date = date,
        )
        TrainingLoadCalculator.recascade(db, date, today)
    }

    fun recalculateCurrentSleepNeed() {
        val profile = loadProfile()
        val result = SleepNeedCalculator(db).calculateCurrent(profile)
        val updatedAt = Clock.System.now().toEpochMilliseconds()
        db.seraphDbQueries.insertIncrementalAggregationIfMissing(
            date = result.date,
            last_agg_ts = null,
            updated_at = updatedAt,
        )
        db.seraphDbQueries.updateSleepNeedForDate(
            sleep_need = result.totalMinutes,
            sleep_need_factors = result.factorsJson(),
            updated_at = updatedAt,
            date = result.date,
        )
    }

    /**
     * Recalculates a single sleep row from raw R24 data.
     * Throws [OverlapException] if the new window overlaps another finalized sleep.
     * Intended to no-op if no R24 data exists in the window yet.
     */
    fun recalcSleep(sleepId: Long) {
        val sleep =
            db.seraphDbQueries.getSleepById(sleepId).executeAsOneOrNull()
                ?: run {
                    log.w { "recalcSleep: sleep $sleepId not found" }
                    return
                }

        val overlap =
            db.seraphDbQueries
                .hasSleepOverlapRange(
                    excludeId = sleepId,
                    end_ts = sleep.end_ts,
                    start_ts = sleep.start_ts,
                ).executeAsOne()
        if (overlap > 0) throw OverlapException("OVERLAP_SLEEP")

        val rows = r24Dao.queryByDateRange(sleep.start_ts, sleep.end_ts + MERGE_GAP_MS)
        if (rows.isEmpty()) return

        db.seraphDbQueries.resetSleepForRecalc(sleepId)

        val profile = loadProfile()
        runForDate(sleep.date, rows, strategyFactory.create(force = false), profile)
    }

    private fun runInternal(
        affectedDates: List<String>,
        force: Boolean = false,
        onDateComplete: ((String) -> Unit)? = null,
    ): AggregationResult {
        if (affectedDates.isEmpty()) return AggregationResult()

        log.i { "Starting aggregation for ${affectedDates.size} date(s): ${affectedDates.sorted()}" }

        val profile = loadProfile()
        log.d { "Profile loaded: age=${profile.age} sleepGoal=${profile.sleepGoalMinutes}min" }

        val newSleepStartTs = mutableListOf<Long>()
        val activityCounts = mutableMapOf<String, Int>()
        val closedActivityStartTs = mutableListOf<Long>()
        var datesProcessed = 0

        val sortedDates = affectedDates.sorted()
        val strategy = strategyFactory.create(force)
        strategy.prepare(sortedDates)

        for (date in sortedDates) {
            strategy.prepareDate(date)
            val lastAggTs = aggDao.getLastAggTs(date)
            val rows = if (lastAggTs != null) r24Dao.queryFromTs(date, lastAggTs) else r24Dao.queryByDate(date)

            val result = runForDate(date, rows, strategy, profile)
            newSleepStartTs.addAll(result.newSleepStartTs)
            result.activityCounts.forEach { (d, c) -> activityCounts[d] = c }
            closedActivityStartTs.addAll(result.closedActivityStartTs)
            datesProcessed++
            onDateComplete?.invoke(date)
        }

        log.i {
            "Aggregation complete: $datesProcessed date(s), ${newSleepStartTs.size} new sleep, ${activityCounts.values.sum()} activities, ${closedActivityStartTs.size} closed"
        }

        baselineCalculator.run()
        if (!force && closedActivityStartTs.isNotEmpty()) {
            TrainingLoadCalculator.recascade(db, sortedDates.first(), DateUtils.todayDateString())
        }
        return AggregationResult(newSleepStartTs, activityCounts, closedActivityStartTs, datesProcessed)
    }

    private fun runForDate(
        date: String,
        rows: List<com.seraph.native.db.r24.R24>,
        strategy: IAggregationStrategy,
        profile: AggregationProfile,
    ): AggregationResult {
        if (rows.isEmpty()) return AggregationResult()

        incrementalAggregator.run(date, rows, strategy, profile)

        val newSleepTs = sleepAggregator.run(date, rows, profile)
        val newSleepStartTs = listOfNotNull(newSleepTs)

        val closed = activityAggregator.run(date, rows, profile)
        val activityCounts = if (closed.isNotEmpty()) mapOf(date to closed.size) else emptyMap()

        allDayHRVAggregator.run(date, rows)

        val dailyTrimp = db.seraphDbQueries.sumTrimpForDate(date).executeAsOne()
        db.seraphDbQueries.updateDailyTrimp(trimp = dailyTrimp, date = date)

        return AggregationResult(newSleepStartTs, activityCounts, closed)
    }

    private fun loadProfile(): AggregationProfile {
        val (_, baselineRhr) = aggDao.getLatestWithBaselines()

        fun param(key: String) = db.seraphDbQueries.getAppParameter(key).executeAsOneOrNull()
        return AggregationProfile(
            age = param("profile_age")?.toIntOrNull(),
            thresholdHr = param("profile_threshold_hr")?.toDoubleOrNull(),
            baselineRhr = baselineRhr,
            baselineMaxHr = param("baseline_max_hr")?.toDoubleOrNull(),
            sleepGoalMinutes = param("profile_sleep_goal_minutes")?.toIntOrNull() ?: 480,
            sleepGoalMode = param("profile_sleep_goal_mode") ?: "adaptive",
            activityMinTrimp = param("activity_min_trimp")?.toDoubleOrNull() ?: 20.0,
            activityMinMs = param("activity_min_ms")?.toLongOrNull() ?: 900_000L,
        )
    }

    companion object {
        fun build(
            db: SeraphDb,
            r24Db: R24Db,
        ): AggregationRunner {
            val aggDao = AggregationDao(db)
            val r24Dao = R24Dao(r24Db)
            return AggregationRunner(
                db = db,
                aggDao = aggDao,
                r24Dao = r24Dao,
                incrementalAggregator = IncrementalAggregator(aggDao, db),
                sleepAggregator = SleepAggregator(db, aggDao, r24Dao),
                activityAggregator = ActivityAggregator(db, r24Dao),
                allDayHRVAggregator = AllDayHRVAggregator(db, aggDao, r24Dao),
                baselineCalculator = BaselineCalculator(aggDao, db),
                strategyFactory = AggregationStrategyFactory(db),
            )
        }
    }
}
