@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.db

import com.seraph.native.db.r24.R24Db
import com.seraph.native.protocol.R24Packet
import kotlin.time.Clock

class R24Dao(
    private val db: R24Db,
) {
    fun insert(packet: R24Packet) {
        db.r24DbQueries.insertR24(
            sequence = packet.sequence.toLong(),
            timestamp = packet.timestampMs,
            subseconds = packet.subseconds.toLong(),
            heart_rate = packet.heartRate.toLong(),
            rr_intervals =
                if (packet.rrIntervals.isEmpty()) null
                else packet.rrIntervals.joinToString(",", "[", "]"),
            skin_temp = packet.skinTemp.toDouble(),
            step_count = packet.stepCount.toLong(),
            b2 = packet.b2.toLong(),
            b80 = packet.b80.toLong(),
            created_at = Clock.System.now().toEpochMilliseconds(),
        )
    }

    fun insertBatch(packets: List<R24Packet>, granularityMs: Long = 1_000L) {
        val now = Clock.System.now().toEpochMilliseconds()
        db.r24DbQueries.transactionWithResult {
            for (packet in packets) {
                if (granularityMs > 1_000L && (packet.timestampMs % granularityMs) >= 1_000L) continue
                db.r24DbQueries.insertR24(
                    sequence = packet.sequence.toLong(),
                    timestamp = packet.timestampMs,
                    subseconds = packet.subseconds.toLong(),
                    heart_rate = packet.heartRate.toLong(),
                    rr_intervals =
                        if (packet.rrIntervals.isEmpty()) null
                        else packet.rrIntervals.joinToString(",", "[", "]"),
                    skin_temp = packet.skinTemp.toDouble(),
                    step_count = packet.stepCount.toLong(),
                    b2 = packet.b2.toLong(),
                    b80 = packet.b80.toLong(),
                    created_at = now,
                )
            }
        }
    }

    fun loadGranularityMs(mainDb: SeraphDb): Long {
        val secs =
            mainDb.seraphDbQueries
                .getAppParameter("r24_granularity_seconds")
                .executeAsOneOrNull()
                ?.toLongOrNull() ?: 1L
        return secs.coerceIn(1L, 10L) * 1_000L
    }

    fun queryByDateRange(startMs: Long, endMs: Long) =
        db.r24DbQueries.queryR24ByDateRange(startMs, endMs).executeAsList()

    fun queryByDate(date: String) =
        db.r24DbQueries.queryR24ByDate(date).executeAsList()

    fun queryFromTs(date: String, fromTs: Long) =
        db.r24DbQueries.queryR24FromTs(date, fromTs).executeAsList()

    fun sampleHrBuckets(startMs: Long, endMs: Long, bucketMs: Long) =
        db.r24DbQueries.sampleHrBuckets(bucketMs = bucketMs, startMs = startMs, endMs = endMs).executeAsList()

    fun rrIntervalsInRange(startMs: Long, endMs: Long) =
        db.r24DbQueries.rrIntervalsInRange(startMs, endMs).executeAsList()

    fun calcRhrForWindow(startMs: Long, endMs: Long): Int =
        db.r24DbQueries.calcRhrForWindow(startMs, endMs).executeAsOneOrNull()?.rhr?.toInt() ?: 0

    fun deleteOlderThan(cutoffMs: Long) =
        db.r24DbQueries.deleteR24OlderThan(cutoffMs)

    fun getOldestTimestamp(): Long? =
        db.r24DbQueries.getOldestTimestamp().executeAsOneOrNull()?.oldest_ts
}
