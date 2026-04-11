package com.seraph.core.calculators

import kotlin.math.roundToInt

/**
 * Sleep score: ratio of actual sleep duration to computed need, capped at 100.
 */
fun calcSleepScore(
    durationMinutes: Int,
    sleepGoalMinutes: Int,
): Int {
    if (sleepGoalMinutes <= 0) return 0
    return ((durationMinutes.toDouble() / sleepGoalMinutes).coerceAtMost(1.0) * 100).roundToInt()
}

fun isSleepByte(b80: Int) = b80 == 32 || b80 == 33
