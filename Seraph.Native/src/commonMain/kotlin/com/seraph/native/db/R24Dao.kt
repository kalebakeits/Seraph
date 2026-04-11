@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.db

import com.seraph.native.protocol.R24Packet
import kotlin.time.Clock

class R24Dao(
    private val db: SeraphDb,
) {
    fun insert(
        packet: R24Packet,
        deviceId: String,
    ) {
        db.seraphDbQueries.insertR24(
            sequence = packet.sequence.toLong(),
            timestamp = packet.timestampMs,
            subseconds = packet.subseconds.toLong(),
            heart_rate = packet.heartRate.toLong(),
            rr_intervals =
                if (packet.rrIntervals.isEmpty()) {
                    null
                } else {
                    packet.rrIntervals.joinToString(",", "[", "]")
                },
            skin_temp = packet.skinTemp.toDouble(),
            step_count = packet.stepCount.toLong(),
            b2 = packet.b2.toLong(),
            b80 = packet.b80.toLong(),
            device_id = deviceId,
            created_at = Clock.System.now().toEpochMilliseconds(),
        )
    }

    fun insertBatch(
        packets: List<R24Packet>,
        deviceId: String,
    ) {
        val now = Clock.System.now().toEpochMilliseconds()
        val granularityMs = loadGranularityMs()
        db.seraphDbQueries.transactionWithResult {
            for (packet in packets) {
                if (granularityMs > 1_000L && (packet.timestampMs % granularityMs) >= 1_000L) continue
                db.seraphDbQueries.insertR24(
                    sequence = packet.sequence.toLong(),
                    timestamp = packet.timestampMs,
                    subseconds = packet.subseconds.toLong(),
                    heart_rate = packet.heartRate.toLong(),
                    rr_intervals =
                        if (packet.rrIntervals.isEmpty()) {
                            null
                        } else {
                            packet.rrIntervals.joinToString(",", "[", "]")
                        },
                    skin_temp = packet.skinTemp.toDouble(),
                    step_count = packet.stepCount.toLong(),
                    b2 = packet.b2.toLong(),
                    b80 = packet.b80.toLong(),
                    device_id = deviceId,
                    created_at = now,
                )
            }
        }
    }

    private fun loadGranularityMs(): Long {
        val secs =
            db.seraphDbQueries
                .getAppParameter("r24_granularity_seconds")
                .executeAsOneOrNull()
                ?.toLongOrNull() ?: 1L
        return secs.coerceIn(1L, 10L) * 1_000L
    }

    fun queryByDateRange(
        startMs: Long,
        endMs: Long,
    ) = db.seraphDbQueries.queryR24ByDateRange(startMs, endMs).executeAsList()

    fun queryByDate(date: String) = db.seraphDbQueries.queryR24ByDate(date).executeAsList()

    fun queryFromTs(
        date: String,
        fromTs: Long,
    ) = db.seraphDbQueries.queryR24FromTs(date, fromTs).executeAsList()

    /** Returns avg HR per bucket for HR chart rendering. bucketMs = (end - start) / 200. */
    fun sampleHrBuckets(
        startMs: Long,
        endMs: Long,
        bucketMs: Long,
    ) = db.seraphDbQueries
        .sampleHrBuckets(
            bucketMs = bucketMs,
            startMs = startMs,
            endMs = endMs,
        ).executeAsList()

    /** Returns (timestamp, rr_intervals) rows only — for RMSSD bucketing without loading full R24 objects. */
    fun rrIntervalsInRange(
        startMs: Long,
        endMs: Long,
    ) = db.seraphDbQueries.rrIntervalsInRange(startMs, endMs).executeAsList()

    /** Returns the lowest 60s-bucket average HR across the window — used as RHR. */
    fun calcRhrForWindow(
        startMs: Long,
        endMs: Long,
    ): Int =
        db.seraphDbQueries
            .calcRhrForWindow(startMs, endMs)
            .executeAsOneOrNull()
            ?.rhr
            ?.toInt() ?: 0

    fun deleteOlderThan(cutoffMs: Long) = db.seraphDbQueries.deleteR24OlderThan(cutoffMs)
}
