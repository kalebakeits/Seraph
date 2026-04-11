package com.seraph.native.sync

import platform.Foundation.NSCalendar
import platform.Foundation.NSCalendarUnitDay
import platform.Foundation.NSCalendarUnitHour
import platform.Foundation.NSCalendarUnitMinute
import platform.Foundation.NSCalendarUnitMonth
import platform.Foundation.NSCalendarUnitSecond
import platform.Foundation.NSCalendarUnitWeekday
import platform.Foundation.NSCalendarUnitYear
import platform.Foundation.NSDate
import platform.Foundation.NSOrderedDescending

actual fun calculateNextOccurrencePlatform(
    hour: Int,
    minute: Int,
): Int {
    val calendar = NSCalendar.currentCalendar
    val now = NSDate()

    val components =
        calendar.components(
            NSCalendarUnitYear or NSCalendarUnitMonth or NSCalendarUnitDay or
                NSCalendarUnitHour or NSCalendarUnitMinute or NSCalendarUnitSecond,
            fromDate = now,
        )
    components.hour = hour.toLong()
    components.minute = minute.toLong()
    components.second = 0

    var alarm = calendar.dateFromComponents(components) ?: return 0

    if (alarm.compare(now) != NSOrderedDescending) {
        components.day = components.day + 1
        alarm = calendar.dateFromComponents(components) ?: return 0
    }

    return (alarm.timeIntervalSince1970).toInt()
}

actual fun dayOfWeekForUnixPlatform(unixSec: Int): Int {
    val calendar = NSCalendar.currentCalendar
    val date = NSDate(timeIntervalSince1970 = unixSec.toDouble())
    val components = calendar.components(NSCalendarUnitWeekday, fromDate = date)
    // NSCalendar weekday: 1=Sun, 2=Mon, … 7=Sat → we want 0=Sun .. 6=Sat
    return (components.weekday - 1).toInt()
}
