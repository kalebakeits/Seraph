package com.seraph.core.model

data class DailySteps(
    val steps: Int,
)

data class DailyHR(
    val avgHr: Int,
    val maxHr: Int,
    val maxHrValidated: Boolean,
)

data class DailyHRV(
    val rmssd: Double,
    val sampleCount: Int,
)

data class DailyStrain(
    val score: Double,
)

data class DailyRecovery(
    val score: Int,
)
