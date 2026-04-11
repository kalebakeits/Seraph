package com.seraph.native.sync

import java.util.Calendar

actual fun calculateNextOccurrencePlatform(
    hour: Int,
    minute: Int,
): Int {
    val now = Calendar.getInstance()
    val alarm =
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

    // If time has already passed today, push to tomorrow
    if (!alarm.after(now)) {
        alarm.add(Calendar.DAY_OF_MONTH, 1)
    }

    return (alarm.timeInMillis / 1000).toInt()
}

actual fun dayOfWeekForUnixPlatform(unixSec: Int): Int {
    val cal =
        Calendar.getInstance().apply {
            timeInMillis = unixSec.toLong() * 1000
        }
    // Calendar.DAY_OF_WEEK: 1=Sun, 2=Mon, … 7=Sat → we want 0=Sun .. 6=Sat
    return cal.get(Calendar.DAY_OF_WEEK) - 1
}
