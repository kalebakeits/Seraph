package com.seraph.native.aggregation.workout

internal data class ActivityParams(
    val fthr: Double,
    val rhr: Double,
    val maxHrForTrimp: Double,
    val minActivityMs: Long,
    val minActivityTrimp: Double,
)
