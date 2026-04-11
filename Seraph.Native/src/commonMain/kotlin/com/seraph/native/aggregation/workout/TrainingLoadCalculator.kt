package com.seraph.native.aggregation.workout

import com.seraph.native.db.SeraphDb
import kotlin.math.pow

private const val CTL_DAYS = 42.0
private const val ATL_DAYS = 7.0

/** Returns the next calendar date string for a "yyyy-MM-dd" input. */
private fun nextDate(date: String): String {
    val y = date.substring(0, 4).toInt()
    val m = date.substring(5, 7).toInt()
    val d = date.substring(8, 10).toInt()
    val daysInMonth =
        when (m) {
            1, 3, 5, 7, 8, 10, 12 -> 31
            4, 6, 9, 11 -> 30
            2 -> if (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) 29 else 28
            else -> 30
        }
    return when {
        d < daysInMonth -> "%04d-%02d-%02d".format(y, m, d + 1)
        m < 12 -> "%04d-%02d-%02d".format(y, m + 1, 1)
        else -> "%04d-%02d-%02d".format(y + 1, 1, 1)
    }
}

/** Returns the number of calendar days from [from] to [to] (both "yyyy-MM-dd"). */
private fun daysBetween(
    from: String,
    to: String,
): Int {
    fun toDays(s: String): Int {
        val y = s.substring(0, 4).toInt()
        val m = s.substring(5, 7).toInt()
        val d = s.substring(8, 10).toInt()
        // Rata Die — days since 0001-01-01
        val a = (14 - m) / 12
        val yr = y + 4800 - a
        val mo = m + 12 * a - 3
        return d + (153 * mo + 2) / 5 + 365 * yr + yr / 4 - yr / 100 + yr / 400 - 32045
    }
    return toDays(to) - toDays(from)
}

object TrainingLoadCalculator {
    /**
     * Update CTL/ATL for [date] after a workout with [trimp] is finalized.
     *
     * [isFirstWorkout] must be true for the first workout of the day (determined by caller).
     * When true, the daily EMA decay is applied from the last known load before [date].
     * When false, [date] already has a decayed ctl/atl — just add the TRIMP contribution.
     */
    fun update(
        db: SeraphDb,
        date: String,
        trimp: Double,
        isFirstWorkout: Boolean,
    ) {
        val (baseCtl, baseAtl, coldStart) =
            if (isFirstWorkout) {
                getDecayedLoad(db, date)
            } else {
                // Subsequent workout today — read today's already-decayed values
                val todayRow =
                    db.seraphDbQueries
                        .getLastDailyWithLoad(before = nextDate(date))
                        .executeAsOneOrNull()
                        ?.takeIf { it.date == date }
                if (todayRow != null) {
                    Triple(todayRow.ctl, todayRow.atl, false)
                } else {
                    getDecayedLoad(db, date)
                }
            }

        val newAtl = baseAtl + trimp * (1.0 / ATL_DAYS)
        // Seed CTL from ATL when no history exists within the CTL window
        val newCtl = if (coldStart) newAtl else baseCtl + trimp * (1.0 / CTL_DAYS)

        db.seraphDbQueries.updateDailyTrainingLoad(ctl = newCtl, atl = newAtl, date = date)
    }

    /**
     * Recomputes CTL/ATL for every daily_aggregation row from [fromDate] forward to [toDate].
     * Gaps (days with no row, or no TRIMP) are handled naturally by the exponential decay.
     * A gap > 42 days triggers a cold start (CTL seeded from ATL) — same as [update].
     */
    fun recascade(
        db: SeraphDb,
        fromDate: String,
        toDate: String,
    ) {
        val rows = db.seraphDbQueries.queryAggregationRange(fromDate, toDate).executeAsList()
        if (rows.isEmpty()) return

        for (row in rows) {
            val trimp = row.trimp ?: 0.0
            val (baseCtl, baseAtl, coldStart) = getDecayedLoad(db, row.date)
            val newAtl = baseAtl + trimp * (1.0 / ATL_DAYS)
            val newCtl = if (coldStart) newAtl else baseCtl + trimp * (1.0 / CTL_DAYS)
            db.seraphDbQueries.updateDailyTrainingLoad(ctl = newCtl, atl = newAtl, date = row.date)
        }
    }

    /**
     * Returns (ctl, atl, coldStart) decayed forward to [date] from the last known row before [date].
     * coldStart is true when there is no CTL history within the CTL window (42 days),
     * meaning CTL should be seeded from ATL after the TRIMP contribution is applied.
     */
    private fun getDecayedLoad(
        db: SeraphDb,
        date: String,
    ): Triple<Double, Double, Boolean> {
        val last =
            db.seraphDbQueries.getLastDailyWithLoad(before = date).executeAsOneOrNull()
                ?: return Triple(0.0, 0.0, true)
        val n = daysBetween(last.date, date)
        if (n <= 0) return Triple(last.ctl, last.atl, false)
        val coldStart = n > CTL_DAYS.toInt()
        val decayedCtl = last.ctl * ((CTL_DAYS - 1) / CTL_DAYS).pow(n.toDouble())
        val decayedAtl = last.atl * ((ATL_DAYS - 1) / ATL_DAYS).pow(n.toDouble())
        return Triple(decayedCtl, decayedAtl, coldStart)
    }
}
