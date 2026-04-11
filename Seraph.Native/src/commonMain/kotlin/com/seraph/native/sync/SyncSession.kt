package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.AggregationRunner
import com.seraph.native.aggregation.DateUtils
import com.seraph.native.db.R24Dao
import com.seraph.native.protocol.Commands
import com.seraph.native.protocol.MetadataType
import com.seraph.native.protocol.PacketMetadata
import com.seraph.native.protocol.R24Packet
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

private val log = Logger.withTag("SyncSession")

/**
 * Owns the historical sync loop for a single requestSync() call.
 *
 * Flow: send command → HISTORY_START → ~20-100 R24 packets → HISTORY_END →
 *       ACK → HISTORY_START → ... → HISTORY_COMPLETE
 *
 * Aggregation strategy:
 * - At each HISTORY_END: aggregate days strictly older than the latest date seen.
 *   Device sends oldest-first, so once past a date it won't get more data for it.
 * - At HISTORY_COMPLETE: aggregate everything (including the latest day).
 * - On error/timeout: flush + aggregate everything so the UI gets partial results.
 */
class SyncSession(
    private val commandChannel: CommandChannel,
    private val metadataChannel: Channel<PacketMetadata>,
    private val r24Dao: R24Dao,
    private val aggregationRunner: AggregationRunner,
    private val deviceId: String,
    private val scope: CoroutineScope,
) {
    @Volatile var packetsReceived: Int = 0
        private set

    private val allDates = mutableSetOf<String>()
    private val aggregatedDates = mutableSetOf<String>()
    private val closedActivityStartTs = mutableListOf<Long>()
    private val newSleepStartTs = mutableListOf<Long>()
    private var lastAcknowledgedTrim: Int? = null

    @Volatile var latestDate: String? = null
        private set

    @Volatile var latestTimestampMs: Long? = null
        private set

    private val pendingPackets = mutableListOf<R24Packet>()
    private val pendingMutex = Mutex()

    suspend fun onR24(packet: R24Packet) {
        pendingMutex.withLock { pendingPackets.add(packet) }
        val date = DateUtils.epochMsToDateString(packet.timestampMs)
        allDates.add(date)
        latestDate = date
        latestTimestampMs = packet.timestampMs
        packetsReceived++
    }

    fun onR25() {
        packetsReceived++
    }

    private suspend fun flushPackets() {
        val batch =
            pendingMutex.withLock {
                if (pendingPackets.isEmpty()) return
                pendingPackets.toList().also { pendingPackets.clear() }
            }
        withContext(Dispatchers.Default) {
            log.i { "Flushing ${batch.size} packets to DB" }
            r24Dao.insertBatch(batch, deviceId)
        }
    }

    private suspend fun aggregateCompletedDays(onDateComplete: ((String) -> Unit)? = null) {
        val latest = latestDate ?: return
        val ready = allDates.filter { it < latest && it !in aggregatedDates }
        if (ready.isEmpty()) return
        val result =
            withContext(Dispatchers.Default) {
                log.i { "Aggregating ${ready.size} completed day(s): ${ready.sorted()}" }
                aggregationRunner.run(ready, onDateComplete = onDateComplete)
            }
        closedActivityStartTs.addAll(result.closedActivityStartTs)
        newSleepStartTs.addAll(result.newSleepStartTs)
        aggregatedDates.addAll(ready)
    }

    private suspend fun aggregateRemaining(onDateComplete: ((String) -> Unit)? = null) {
        val remaining = allDates.filter { it !in aggregatedDates }
        if (remaining.isEmpty()) return
        val result =
            withContext(Dispatchers.Default) {
                log.i { "Aggregating remaining ${remaining.size} day(s): ${remaining.sorted()}" }
                aggregationRunner.run(remaining, onDateComplete = onDateComplete)
            }
        closedActivityStartTs.addAll(result.closedActivityStartTs)
        newSleepStartTs.addAll(result.newSleepStartTs)
        aggregatedDates.addAll(remaining)
    }

    data class Result(
        val dates: List<String>,
        val closedActivityStartTs: List<Long>,
        val newSleepStartTs: List<Long>,
        val lastTrim: Int?,
    )

    suspend fun run(
        onBatchComplete: (Int, String?) -> Unit,
        onAggregating: () -> Unit = {},
        onDateComplete: (
            (String) -> Unit
        )? = null,
        onTrimAcked: ((Int, Long?) -> Unit)? = null,
    ): Result {
        commandChannel.syncActive = true
        var aggJob: Job? = null
        try {
            commandChannel.send(Commands.sendHistoricalData())

            while (true) {
                val meta = withTimeout(30_000) { metadataChannel.receive() }
                when (meta.type) {
                    MetadataType.HISTORY_START -> {
                        log.i { "History transfer started" }
                    }
                    MetadataType.HISTORY_END -> {
                        log.i { "Batch end — trim=${meta.trimValue} packets=$packetsReceived latest=$latestDate" }
                        lastAcknowledgedTrim = meta.trimValue
                        flushPackets()
                        aggJob = scope.launch(Dispatchers.Default) { aggregateCompletedDays(onDateComplete) }
                        onTrimAcked?.invoke(meta.trimValue, latestTimestampMs)
                        commandChannel.send(Commands.sendHistoricalDataResult(meta.trimValue))
                        onBatchComplete(packetsReceived, latestDate)
                    }
                    MetadataType.HISTORY_COMPLETE -> {
                        commandChannel.syncActive = false
                        flushPackets()
                        onAggregating()
                        aggJob?.join()
                        aggregateRemaining(onDateComplete)
                        commandChannel.flushAll()
                        log.i { "History complete — $packetsReceived packets, ${allDates.size} day(s)" }
                        return Result(
                            allDates.toList(),
                            closedActivityStartTs.toList(),
                            newSleepStartTs.toList(),
                            lastAcknowledgedTrim,
                        )
                    }
                }
            }
        } catch (e: Exception) {
            commandChannel.syncActive = false
            try {
                flushPackets()
                aggJob?.join()
                aggregateRemaining()
                commandChannel.flushAll()
                log.i { "Aggregated ${allDates.size} day(s) after sync error" }
            } catch (aggErr: Exception) {
                log.e(aggErr) { "Post-error aggregation failed" }
            }
            throw e
        }
    }
}
