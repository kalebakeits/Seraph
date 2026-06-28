@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation.sleep

import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.aggregation.DateUtils
import com.seraph.native.db.SeraphDb
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlin.time.Clock

data class SleepNeedResult(
    val date: String,
    val mode: String,
    val baseMinutes: Double,
    val totalMinutes: Double,
    val debtAdjMinutes: Double,
    val strainAdjMinutes: Double,
    val anchorSleepId: Long?,
    val anchorWakeTs: Long?,
    val strainWindowStartTs: Long?,
    val strainWindowEndTs: Long?,
) {
    fun factorsJson(): String =
        buildJsonObject {
            put("version", JsonPrimitive(1))
            put("mode", JsonPrimitive(mode))
            put("baseMinutes", JsonPrimitive(baseMinutes))
            put("totalMinutes", JsonPrimitive(totalMinutes))
            put("debtAdjMinutes", JsonPrimitive(debtAdjMinutes))
            put("strainAdjMinutes", JsonPrimitive(strainAdjMinutes))
            anchorSleepId?.let { put("anchorSleepId", JsonPrimitive(it)) }
            anchorWakeTs?.let { put("anchorWakeTs", JsonPrimitive(it)) }
            strainWindowStartTs?.let { put("strainWindowStartTs", JsonPrimitive(it)) }
            strainWindowEndTs?.let { put("strainWindowEndTs", JsonPrimitive(it)) }
        }.toString()
}

/**
 * Calculates tonight's sleep need in minutes.
 *
 * Formula:
 *   base       = profile_sleep_goal_minutes (default 480)
 *   debtAdj    = clamp(goalMin*7 - sumSleepLast7d, 0, 60)   // max +1h payback
 *   strainAdj  = 0/15/30/45 for strain <10/10-14/14-18/>=18
 *   result     = clamp(base + debtAdj + strainAdj, 420, 585)
 */
class SleepNeedCalculator(
    private val db: SeraphDb,
) {
    fun calculateCurrent(profile: AggregationProfile): SleepNeedResult {
        val nowMs = Clock.System.now().toEpochMilliseconds()
        val anchorSleep = findLastMainSleep()
        val date = anchorSleep?.date ?: DateUtils.epochMsToDateString(nowMs)
        return calculate(date, profile, anchorSleep?.id, anchorSleep?.end_ts, nowMs)
    }

    fun calculate(
        date: String,
        profile: AggregationProfile,
    ): SleepNeedResult {
        val anchorSleep = findMainSleepForDate(date)
        return calculate(
            date = date,
            profile = profile,
            anchorSleepId = anchorSleep?.id,
            anchorWakeTs = anchorSleep?.end_ts,
            nowMs = Clock.System.now().toEpochMilliseconds(),
        )
    }

    private fun calculate(
        date: String,
        profile: AggregationProfile,
        anchorSleepId: Long?,
        anchorWakeTs: Long?,
        nowMs: Long,
    ): SleepNeedResult {
        val goalMin = profile.sleepGoalMinutes.toDouble()

        // Upper bound of the awake interval: never beyond the end of `date`, even when
        // reaggregating a past day where `nowMs` is days in the future.
        val endOfDateMs = DateUtils.dateToMidnightMs(date) + 86_400_000L
        val windowEndMs = minOf(nowMs, endOfDateMs)

        if (profile.sleepGoalMode == "fixed") {
            return SleepNeedResult(
                date = date,
                mode = "fixed",
                baseMinutes = goalMin,
                totalMinutes = goalMin,
                debtAdjMinutes = 0.0,
                strainAdjMinutes = 0.0,
                anchorSleepId = anchorSleepId,
                anchorWakeTs = anchorWakeTs,
                strainWindowStartTs = anchorWakeTs,
                strainWindowEndTs = windowEndMs,
            )
        }

        // 7-day sleep debt
        val from7 = subtractDays(date, 7)
        val sleepLast7 =
            db.seraphDbQueries
                .querySleepRange(from7)
                .executeAsList()
                .filter { it.finalized == 1L && it.date >= from7 && it.date < date }
                .groupBy { it.date }
                .values
                .mapNotNull { sleeps -> sleeps.minByOrNull { it.end_ts } }
                .sumOf { it.duration_minutes.toLong() }
                .toDouble()
        val debtAdj = (goalMin * 7 - sleepLast7).coerceIn(0.0, 60.0)

        // Strain adjustment. Daily strain rows are full-day aggregates, so the anchor's
        // own date is excluded when the anchor wake-up happened on an earlier day —
        // otherwise pre-bedtime strain from before the awake interval would leak in.
        val anchorDate = anchorWakeTs?.let { DateUtils.epochMsToDateString(it) }
        val strainFrom =
            when {
                anchorDate == null -> date
                anchorDate < date -> DateUtils.epochMsToDateString(DateUtils.dateToMidnightMs(anchorDate) + 86_400_000L)
                else -> date
            }
        val strainUntil = DateUtils.epochMsToDateString(windowEndMs)
        val strain =
            if (strainFrom > strainUntil) {
                0.0
            } else {
                db.seraphDbQueries
                    .queryAggregationRange(strainFrom, strainUntil)
                    .executeAsList()
                    .maxOfOrNull { it.strain ?: 0.0 } ?: 0.0
            }
        val strainAdj =
            when {
                strain >= 18 -> 45.0
                strain >= 14 -> 30.0
                strain >= 10 -> 15.0
                else -> 0.0
            }

        val total = (goalMin + debtAdj + strainAdj).coerceIn(420.0, 585.0)
        return SleepNeedResult(
            date = date,
            mode = "adaptive",
            baseMinutes = goalMin,
            totalMinutes = total,
            debtAdjMinutes = debtAdj,
            strainAdjMinutes = strainAdj,
            anchorSleepId = anchorSleepId,
            anchorWakeTs = anchorWakeTs,
            strainWindowStartTs = anchorWakeTs,
            strainWindowEndTs = windowEndMs,
        )
    }

    private fun findLastMainSleep() =
        db.seraphDbQueries
            .queryRecentFinalizedSleeps(30)
            .executeAsList()
            .groupBy { it.date }
            .values
            .mapNotNull { sleeps -> sleeps.minByOrNull { it.end_ts } }
            .maxByOrNull { it.end_ts }

    private fun findMainSleepForDate(date: String) =
        db.seraphDbQueries
            .querySleepByDate(date)
            .executeAsList()
            .filter { it.finalized == 1L }
            .minByOrNull { it.end_ts }

    private fun subtractDays(
        isoDate: String,
        days: Int,
    ): String {
        val parts = isoDate.split("-")
        if (parts.size != 3) return isoDate
        var y = parts[0].toInt()
        var m = parts[1].toInt()
        var d = parts[2].toInt()

        var daysLeft = days
        while (daysLeft > 0) {
            d -= 1
            if (d < 1) {
                m -= 1
                if (m < 1) {
                    m = 12
                    y -= 1
                }
                d = daysInMonth(y, m)
            }
            daysLeft--
        }
        return "%04d-%02d-%02d".format(y, m, d)
    }

    private fun daysInMonth(
        y: Int,
        m: Int,
    ): Int =
        when (m) {
            1, 3, 5, 7, 8, 10, 12 -> 31
            4, 6, 9, 11 -> 30
            2 -> if (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) 29 else 28
            else -> 30
        }
}
