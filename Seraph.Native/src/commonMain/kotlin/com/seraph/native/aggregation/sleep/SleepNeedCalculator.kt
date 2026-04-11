package com.seraph.native.aggregation.sleep

import com.seraph.native.db.SeraphDb

data class SleepNeedResult(
    val totalMinutes: Double,
    val debtAdjMinutes: Double,
    val strainAdjMinutes: Double,
)

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
    fun calculate(date: String): SleepNeedResult {
        val goalMin =
            db.seraphDbQueries
                .getAppParameter("profile_sleep_goal_minutes")
                .executeAsOneOrNull()
                ?.toDoubleOrNull() ?: 480.0

        // 7-day sleep debt
        val from7 = subtractDays(date, 7)
        val sleepLast7 =
            db.seraphDbQueries
                .querySleepRange(from7)
                .executeAsList()
                .filter { it.date >= from7 && it.date < date }
                .sumOf { it.duration_minutes.toLong() }
                .toDouble()
        val debtAdj = (goalMin * 7 - sleepLast7).coerceIn(0.0, 60.0)

        // Strain adjustment
        val strain =
            db.seraphDbQueries
                .queryAggregationRange(date, date)
                .executeAsList()
                .firstOrNull()
                ?.strain ?: 0.0
        val strainAdj =
            when {
                strain >= 18 -> 45.0
                strain >= 14 -> 30.0
                strain >= 10 -> 15.0
                else -> 0.0
            }

        val total = (goalMin + debtAdj + strainAdj).coerceIn(420.0, 585.0)
        return SleepNeedResult(
            totalMinutes = total,
            debtAdjMinutes = debtAdj,
            strainAdjMinutes = strainAdj,
        )
    }

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
