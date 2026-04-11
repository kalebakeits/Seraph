package com.seraph.core.calculators

import com.seraph.core.model.DailyRecovery
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Recovery score: baseline-relative composite of autonomic readiness and sleep quality.
 *
 * Inputs (all from the first finalized sleep of the day):
 *  - rmssd:         sleep-window HRV (ms)
 *  - rhr:           resting HR from sleep window (bpm)
 *  - sleepScore:    duration-vs-need percentage (0–100)
 *  - baselineHrv:   30-day median HRV
 *  - baselineRhr:   30-day median RHR
 *
 * Each component is scored 0–100 relative to the personal baseline, then weighted:
 *  - HRV vs baseline:  35%  (higher is better — parasympathetic readiness)
 *  - RHR vs baseline:  30%  (lower is better — cardiovascular recovery)
 *  - Sleep score:       35%  (duration relative to computed need)
 *
 * HRV component: maps the ratio (rmssd / baseline) through a sigmoid-like curve.
 *   ratio 0.5 → ~15, ratio 1.0 → 50, ratio 1.5 → ~85, ratio 2.0 → ~95.
 *   This captures that being 50% above baseline is great but has diminishing returns,
 *   while being 50% below is significantly bad.
 *
 * RHR component: inverted — lower is better. Same curve shape on (baseline / rhr).
 *   5 bpm below baseline → ~70, at baseline → 50, 5 bpm above → ~30.
 *
 * Sleep score: passed through directly (already 0–100).
 *
 * If baselines are unavailable, the missing component gets score 50 (neutral).
 */
fun calculateRecovery(
    rmssd: Double,
    rhr: Double,
    sleepScore: Int,
    baselineHrv: Double?,
    baselineRhr: Double?,
): DailyRecovery {
    val hrvComponent =
        if (baselineHrv != null && baselineHrv > 0 && rmssd > 0) {
            val ratio = rmssd / baselineHrv
            ratioToScore(ratio)
        } else {
            50.0
        }

    val rhrComponent =
        if (baselineRhr != null && baselineRhr > 0 && rhr > 0) {
            // Invert: lower RHR is better, so we use baseline/rhr as the ratio
            val ratio = baselineRhr / rhr
            ratioToScore(ratio)
        } else {
            50.0
        }

    val sleepComponent = sleepScore.toDouble().coerceIn(0.0, 100.0)

    val raw = hrvComponent * 0.35 + rhrComponent * 0.30 + sleepComponent * 0.35
    val score = max(0, min(100, raw.roundToInt()))
    return DailyRecovery(score)
}

/**
 * Maps a ratio (value / baseline) to a 0–100 score using a logistic curve.
 * ratio 0.5 → ~15, ratio 1.0 → 50, ratio 1.5 → ~85.
 * Steepness k=5 gives good sensitivity around the baseline without being too jumpy.
 */
private fun ratioToScore(ratio: Double): Double {
    val k = 5.0
    val x = ratio - 1.0 // centered at 0 when at baseline
    return 100.0 / (1.0 + kotlin.math.exp(-k * x))
}
