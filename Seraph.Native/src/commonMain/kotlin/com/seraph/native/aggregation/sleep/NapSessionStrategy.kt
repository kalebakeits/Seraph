package com.seraph.native.aggregation.sleep

import com.seraph.core.calculators.isSleepByte
import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events
import com.seraph.native.db.r24.R24

/**
 * Processes rows for a smart nap session (is_manual = 3).
 *
 * start_ts semantics:
 *   - Inserted as 0 by the app — onset not yet detected.
 *   - Set to the first sleep byte's timestamp once the strap confirms sleep onset.
 *
 * end_ts semantics:
 *   - Inserted as the hard cutoff (alarm time). This is only the alarm ceiling,
 *     not the true wake time. end_ts advances with each sleep byte so it always
 *     reflects when the user was last detected asleep.
 *
 * The session never closes on its own — it stays open until finalized via the
 * normal close path (NapSyncStrategy detects goal met, or the user wakes and
 * AutoSessionOpener opens a new session whose overlap check cleans this one up).
 */
internal class NapSessionStrategy(
    private val db: SeraphDb,
    private val closer: SleepWindowCloser,
) : ISleepSessionStrategy {
    // Tracks live end_ts as we advance it — session.end_ts is a stale snapshot.
    private var currentEndTs: Long? = null
    private var onsetDetected = false

    override fun extend(
        session: Sleep_events,
        row: R24,
        date: String,
        profile: AggregationProfile,
    ): RowResult {
        if (currentEndTs == null) {
            currentEndTs = session.end_ts
            onsetDetected = session.start_ts > 0L
        }

        if (!isSleepByte(row.b80.toInt())) {
            // Awake gap — only meaningful once onset is detected
            if (onsetDetected) {
                db.seraphDbQueries.setPendingAwakeEdited(
                    awake_ms = row.timestamp - currentEndTs!!,
                    id = session.id,
                )
            }
            return RowResult.EXTENDED
        }

        val accum = accumRow(row)

        if (!onsetDetected) {
            // First sleep byte — set start_ts (onset) and initialise end_ts
            db.seraphDbQueries.setNapOnset(
                start_ts = row.timestamp,
                end_ts = row.timestamp,
                hr_sum = accum.hrSum,
                hr_count = accum.hrCount,
                hrv_sq_sum = accum.hrvSqSum,
                hrv_count = accum.hrvCount,
                id = session.id,
            )
            onsetDetected = true
        } else {
            // Subsequent sleep byte — advance end_ts (true wake time), commit awake gap
            db.seraphDbQueries.extendNapSleep(
                end_ts = row.timestamp,
                hr_sum = accum.hrSum,
                hr_count = accum.hrCount,
                hrv_sq_sum = accum.hrvSqSum,
                hrv_count = accum.hrvCount,
                id = session.id,
            )
        }

        currentEndTs = row.timestamp
        return RowResult.EXTENDED
    }

    override fun concludeIfReady(
        session: Sleep_events,
        lastTs: Long,
        date: String,
        profile: AggregationProfile,
    ): Long? {
        // Smart nap sessions are closed by NapSyncStrategy (goal met) or by the
        // manual cancel path — not by the aggregator's post-loop sweep.
        return null
    }
}
