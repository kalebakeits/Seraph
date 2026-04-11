@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation

import kotlin.time.Clock

object DateUtils {
    fun epochMsToDateString(ms: Long): String {
        val days = ms / 86_400_000L
        var z = days + 719468
        val era = if (z >= 0) z else z - 146096
        val doe = (era % 146097).let { if (it < 0) it + 146097 else it }
        val yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365
        val y = yoe + era / 146097 * 400
        val doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
        val mp = (5 * doy + 2) / 153
        val d = doy - (153 * mp + 2) / 5 + 1
        val mo = if (mp < 10) mp + 3 else mp - 9
        val yr = if (mo <= 2) y + 1 else y
        return "%04d-%02d-%02d".format(yr, mo, d)
    }

    fun todayDateString() = epochMsToDateString(Clock.System.now().toEpochMilliseconds())

    fun dateStringDaysAgo(days: Int) = epochMsToDateString(Clock.System.now().toEpochMilliseconds() - days * 86_400_000L)

    fun dateStringDaysAgo(
        days: Int,
        anchorDate: String,
    ) = epochMsToDateString(
        dateToMidnightMs(anchorDate) - days * 86_400_000L,
    )

    fun isYesterdayOrOlder(date: String) = date < todayDateString()

    fun dateToMidnightMs(date: String): Long {
        val parts = date.split('-')
        val y = parts[0].toLong()
        val m = parts[1].toLong()
        val d = parts[2].toLong()
        val era = if (m > 2) y else y - 1
        val yoe = era % 400
        val doy = (153 * (if (m > 2) m - 3 else m + 9) + 2) / 5 + d - 1
        val doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
        val days = era / 400 * 146097 + doe - 719468
        return days * 86_400_000L
    }
}
