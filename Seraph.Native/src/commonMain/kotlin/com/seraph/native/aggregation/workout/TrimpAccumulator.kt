package com.seraph.native.aggregation.workout

import com.seraph.core.calculators.ZoneSeconds
import com.seraph.native.db.R24
import com.seraph.native.db.SeraphDb
import kotlin.math.exp

private const val MAX_GAP_MIN = 5.0
private const val MAX_ZONE_DT_SEC = 60L

/**
 * Shared TRIMP + zone accumulation logic used by both [AutoWindow] and [ManualWindow].
 * Each window owns an instance; [onRow] is called per R24 sample.
 */
internal class TrimpAccumulator(
    private val params: ActivityParams,
    private val activityId: Long,
) {
    private var prevTs: Long? = null
    private var z1 = 0L
    private var z2 = 0L
    private var z3 = 0L
    private var z4 = 0L
    private var z5 = 0L

    /** Seed prevTs when resuming an already-open window. */
    fun seedPrevTs(ts: Long) {
        if (prevTs == null && ts > 0) prevTs = ts
    }

    fun onRow(
        r24: R24,
        db: SeraphDb,
    ) {
        val hr = r24.heart_rate.toDouble()
        val hrValid = r24.heart_rate > 0
        val prev = prevTs
        val dtMin = if (prev != null) (r24.timestamp - prev) / 60000.0 else 0.0
        val dtSec = if (prev != null) ((r24.timestamp - prev) / 1000L).coerceIn(0L, MAX_ZONE_DT_SEC) else 0L

        val trimpIncr =
            if (hrValid && dtMin in 0.0..MAX_GAP_MIN) {
                val range = params.maxHrForTrimp - params.rhr
                if (range > 0) {
                    val hrr = ((hr - params.rhr) / range).coerceIn(0.0, 1.0)
                    dtMin * hrr * 0.64 * exp(1.92 * hrr)
                } else {
                    0.0
                }
            } else {
                0.0
            }

        if (hrValid && dtSec > 0) {
            when {
                hr < params.fthr * 0.72 -> z1 += dtSec
                hr < params.fthr * 0.83 -> z2 += dtSec
                hr < params.fthr * 0.94 -> z3 += dtSec
                hr < params.fthr * 1.05 -> z4 += dtSec
                else -> z5 += dtSec
            }
        }

        db.seraphDbQueries.updateActivityAccumulators(
            end_ts = r24.timestamp,
            hr_sum = if (hrValid) hr else 0.0,
            hr_count = if (hrValid) 1L else 0L,
            max_hr = hr,
            hr_samples = "[]", // written at finalize
            zone_seconds = "[]", // written at finalize
            trimp = trimpIncr,
            id = activityId,
        )

        prevTs = r24.timestamp
    }

    fun zones(): ZoneSeconds = ZoneSeconds(z1, z2, z3, z4, z5)
}
