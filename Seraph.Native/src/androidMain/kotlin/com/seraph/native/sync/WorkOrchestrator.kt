@file:OptIn(kotlin.time.ExperimentalTime::class, kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.AggregationRunner
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.notifications.NotificationPayloadBuilder
import com.seraph.native.notifications.NotificationWriter
import com.seraph.native.parsers.PacketRouter
import com.seraph.native.protocol.Commands
import com.seraph.native.protocol.Framing
import com.seraph.native.protocol.PacketMetadata
import com.seraph.native.protocol.PacketType
import com.seraph.native.protocol.R24Packet
import com.seraph.native.recording.RecordingManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicInteger
import kotlin.time.Clock

private val log = Logger.withTag("WorkOrchestrator")

private const val SYNC_INTERVAL_MS = 15L * 60 * 1000

private const val SYNC_TICK_MS = 5_000L
private const val SYNC_RETRY_BACKOFF_MS = 30_000L

/**
 * Owns all native work: BLE sync and re-aggregation.
 * Knows nothing about connection — assumes BLE is already up for sync.
 * Receives raw BLE notifications via [onNotification].
 */
class WorkOrchestrator(
    private val aggregationRunner: AggregationRunner,
    private val r24Dao: R24Dao,
    private val db: SeraphDb,
    private val scope: CoroutineScope,
    private val onMonthRollover: (() -> Unit)? = null,
    private val notificationWriter: NotificationWriter? = null,
) {
    // BLE dependencies — set on connect
    lateinit var device: Device
        private set
    lateinit var commandChannel: CommandChannel
        private set
    private lateinit var packetRouter: PacketRouter
    private var onRawHistoricalPacket: ((type: String, raw: ByteArray) -> Unit)? = null
    private var onRealtimeHR: ((hr: Int) -> Unit)? = null

    // In-memory device state — populated on connect, dies with the service
    @Volatile var cachedBattery: Double? = null

    @Volatile var cachedOnWrist: Boolean? = null

    @Volatile var cachedCharging: Boolean? = null

    @Volatile var cachedAlarm: Int? = null

    fun attachBle(
        device: Device,
        channel: CommandChannel,
        router: PacketRouter,
        onRawPacket: ((String, ByteArray) -> Unit)? = null,
        onRealtimeHR: ((hr: Int) -> Unit)? = null,
    ) {
        this.device = device
        this.commandChannel = channel
        this.packetRouter = router
        this.onRawHistoricalPacket = onRawPacket
        this.onRealtimeHR = onRealtimeHR
    }

    suspend fun fetchDeviceState() {
        try {
            val hello = device.getHello()
            if (hello != null) {
                cachedOnWrist = hello.onWrist
                cachedCharging = hello.charging
            }
        } catch (_: Exception) {
        }
        try {
            val battery = device.getBattery()
            if (battery != null) cachedBattery = battery.level.toDouble()
        } catch (_: Exception) {
        }
        try {
            val alarm = device.getAlarm()
            cachedAlarm = alarm
        } catch (_: Exception) {
        }
    }

    private val _state = MutableStateFlow<SyncState>(SyncState.Idle)
    val state: StateFlow<SyncState> = _state.asStateFlow()

    private val metadataChannel = Channel<PacketMetadata>(capacity = 32)
    private val _deviceEvents = MutableSharedFlow<DeviceEvent>(extraBufferCapacity = 64)
    val deviceEvents: SharedFlow<DeviceEvent> = _deviceEvents.asSharedFlow()

    private val _realtimeHR = MutableSharedFlow<Int>(extraBufferCapacity = 64)
    val realtimeHR: SharedFlow<Int> = _realtimeHR.asSharedFlow()

    private val _trimAcked = MutableSharedFlow<Int>(extraBufferCapacity = 16)
    val trimAcked: SharedFlow<Int> = _trimAcked.asSharedFlow()

    private val workCount = AtomicInteger(0)
    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    @Volatile private var activeSession: SyncSession? = null

    @Volatile private var syncJob: Job? = null

    @Volatile private var syncing = false

    data class DeviceEvent(
        val eventNum: Byte,
        val payload: ByteArray,
    )

    // ── Called by ConnectionManager whenever a BLE notification arrives ────────

    fun onNotification(raw: ByteArray) {
        if (raw.size < 5) {
            log.w { "Packet too short (${raw.size}b)" }
            return
        }

        val (valid, payload) = Framing.parsePacket(raw)
        if (!valid || payload == null) {
            log.w { "Frame invalid" }
            return
        }

        when (payload[0]) {
            PacketType.COMMAND_RESPONSE -> {
                if (payload.size >= 3) commandChannel.onCommandResponse(payload[2], raw)
            }
            PacketType.EVENT -> {
                packetRouter.route(payload) ?: return
                _deviceEvents.tryEmit(DeviceEvent(payload[2], payload))
            }
            PacketType.HISTORICAL_DATA -> {
                val result = packetRouter.route(payload) ?: return
                when (result.eventType) {
                    "historicalR24Data" -> {
                        result.rawPayload?.let { onRawHistoricalPacket?.invoke("R24", it) }
                        scope.launch { activeSession?.onR24(result.data as R24Packet) }
                    }
                    "historicalR25Data" -> {
                        result.rawPayload?.let { onRawHistoricalPacket?.invoke("R25", it) }
                        activeSession?.onR25()
                    }
                }
            }
            PacketType.METADATA -> {
                val result = packetRouter.route(payload) ?: return
                val meta = result.data as? PacketMetadata ?: return
                metadataChannel.trySend(meta)
            }
            PacketType.REALTIME_DATA -> {
                // payload[8] = heart rate (data[5] in TS lib reference)
                if (payload.size >= 9) {
                    val hr = payload[8].toInt() and 0xFF
                    _realtimeHR.tryEmit(hr)
                    onRealtimeHR?.invoke(hr)
                }
            }
            else -> log.d { "Unhandled payload type 0x${payload[0].toInt().and(0xFF).toString(16)}" }
        }
    }

    // ── Sync ──────────────────────────────────────────────────────────────────

    suspend fun requestSync(lastTrim: Int? = null) {
        if (syncing || aggregationRunner.isRunning) {
            log.d { "requestSync ignored — already syncing or aggregating" }
            return
        }
        syncJob = currentCoroutineContext()[Job]
        syncing = true
        _busy.value = true
        workCount.incrementAndGet()

        try {
            val nowSec = (Clock.System.now().toEpochMilliseconds() / 1000).toInt()
            device.setClock(nowSec)

            if (lastTrim != null) commandChannel.send(Commands.forceTrim(lastTrim))

            _state.value = SyncState.Syncing(0)
            while (!metadataChannel.isEmpty) metadataChannel.tryReceive()

            val session = SyncSession(commandChannel, metadataChannel, r24Dao, aggregationRunner, "", scope)
            activeSession = session
            val result =
                session.run(
                    onBatchComplete = { packets, latestDate -> _state.value = SyncState.Syncing(packets, latestDate) },
                    onAggregating = { _state.value = SyncState.Aggregating },
                    onDateComplete = { date -> _state.value = SyncState.AggregatingDate(date) },
                    onTrimAcked = { trim, tsMs ->
                        val now = Clock.System.now().toEpochMilliseconds()
                        db.seraphDbQueries.setAppParameter("lastTrim", trim.toString(), now)
                        if (tsMs != null) db.seraphDbQueries.setAppParameter("lastTrimTs", tsMs.toString(), now)
                        _trimAcked.tryEmit(trim)
                    },
                )
            activeSession = null
            log.i {
                "Sync complete — ${result.dates.size} date(s): ${result.dates.sorted()}, ${result.closedActivityStartTs.size} closed activities, ${result.newSleepStartTs.size} new sleep, lastTrim=${result.lastTrim}"
            }
            _state.value = SyncState.Complete(result.dates, result.closedActivityStartTs, result.newSleepStartTs)

            if (isFirstOfMonth()) {
                scope.launch(Dispatchers.Default) {
                    try {
                        onMonthRollover?.invoke()
                    } catch (
                        e: Exception,
                    ) {
                        log.e(e) { "Month rollover (sharding) failed" }
                    }
                }
            }
        } catch (e: Exception) {
            activeSession = null
            log.e(e) { "Sync error" }
            _state.value = SyncState.Error(e.message ?: "Sync error")
        } finally {
            syncing = false
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    suspend fun abortSync() {
        log.i { "abortSync" }
        try {
            commandChannel.sendImmediate(Commands.abortHistoricalTransmits())
        } catch (_: Exception) {
        }
        syncJob?.cancel()
        syncJob = null
    }

    suspend fun forceTrim(trimValue: Int) {
        log.i { "forceTrim — value=$trimValue" }
        device.forceTrim(trimValue)
        db.seraphDbQueries.setAppParameter("lastTrim", trimValue.toString(), Clock.System.now().toEpochMilliseconds())
    }

    /**
     * Returns the last acknowledged trim value, when it was saved (ms epoch),
     * and the R24 timestamp that sequence number corresponds to (ms epoch) if present.
     */
    fun getLastTrim(): Triple<Int?, Long?, Long?> {
        val row =
            db.seraphDbQueries.getAppParameterRow("lastTrim").executeAsOneOrNull()
                ?: return Triple(null, null, null)
        val trimVal = row.paramValue.toIntOrNull()
        val savedAt = row.updated_at
        val r24Ts =
            db.seraphDbQueries
                .getAppParameter("lastTrimTs")
                .executeAsOneOrNull()
                ?.toLongOrNull()
        return Triple(trimVal, savedAt, r24Ts)
    }

    // ── Re-aggregation ────────────────────────────────────────────────────────

    suspend fun recalcActivity(activityId: Long) {
        _busy.value = true
        workCount.incrementAndGet()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) {
                aggregationRunner.recalcActivity(activityId)
            }
            notificationWriter?.let { nw ->
                NotificationPayloadBuilder.workoutPayload(db, activityId)?.let { (payload, entityType) ->
                    nw.write(type = "workout_edited", payload = payload, entityType = entityType, entityId = activityId)
                }
            }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    suspend fun recalcSleep(sleepId: Long) {
        _busy.value = true
        workCount.incrementAndGet()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) {
                aggregationRunner.recalcSleep(sleepId)
            }
            notificationWriter?.let { nw ->
                NotificationPayloadBuilder.sleepPayload(db, sleepId)?.let { (payload, entityType) ->
                    nw.write(type = "sleep_edited", payload = payload, entityType = entityType, entityId = sleepId)
                }
            }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    suspend fun refreshDailyLoad(date: String) {
        _busy.value = true
        workCount.incrementAndGet()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) {
                aggregationRunner.refreshDailyLoad(date)
            }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    suspend fun reaggregate(dates: List<String>) {
        if (dates.isEmpty()) return
        _busy.value = true
        workCount.incrementAndGet()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) {
                for (date in dates) {
                    db.seraphDbQueries.deleteActivityNotificationsForDate(date)
                    db.seraphDbQueries.deleteSleepNotificationsForDate(date)
                }
                aggregationRunner.run(dates, force = true) { date ->
                    _state.value = SyncState.AggregatingDate(date)
                }
            }
            _state.value = SyncState.Complete(dates)
        } finally {
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    // ── Sync loop ─────────────────────────────────────────────────────────────

    private var syncLoopJob: Job? = null

    @Volatile private var immediate = false

    fun startSyncLoop() {
        if (syncLoopJob?.isActive == true) return
        log.i { "SyncLoop started" }
        syncLoopJob =
            scope.launch {
                var nextSync = System.currentTimeMillis() + SYNC_INTERVAL_MS
                while (isActive) {
                    delay(SYNC_TICK_MS)
                    val state = _state.value
                    if (state is SyncState.Syncing || state is SyncState.Aggregating) continue
                    val due = System.currentTimeMillis() >= nextSync || immediate
                    if (!due) continue
                    immediate = false
                    try {
                        log.i { "Auto-sync triggering" }
                        _busy.value = true
                        requestSync()
                        nextSync = System.currentTimeMillis() + SYNC_INTERVAL_MS
                    } catch (e: Exception) {
                        log.e(e) { "Auto-sync failed — backing off" }
                        nextSync = System.currentTimeMillis() + SYNC_RETRY_BACKOFF_MS
                    }
                }
            }
    }

    fun stopSyncLoop() {
        syncLoopJob?.cancel()
        syncLoopJob = null
        log.i { "SyncLoop stopped" }
    }

    fun triggerImmediately() {
        immediate = true
    }

    // ── Recording ─────────────────────────────────────────────────────────────

    fun startRecording(
        rm: RecordingManager,
        sportLabel: String,
    ) {
        workCount.incrementAndGet()
        _busy.value = true
        try {
            rm.start(sportLabel)
        } catch (e: Exception) {
            if (workCount.decrementAndGet() == 0) _busy.value = false
            throw e
        }
    }

    suspend fun stopRecording(rm: RecordingManager): RecordingManager.StopResult? {
        try {
            val result = rm.stop() ?: return null
            aggregationRunner.finalizeRecordedActivity(result.activityId, result.syntheticRows)
            notificationWriter?.let { nw ->
                NotificationPayloadBuilder.workoutPayload(db, result.activityId)?.let { (payload, entityType) ->
                    nw.write(type = "workout_recorded", payload = payload, entityType = entityType, entityId = result.activityId)
                }
            }
            return result
        } finally {
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    fun discardRecording(rm: RecordingManager) {
        try {
            rm.discard()
        } finally {
            if (workCount.decrementAndGet() == 0) _busy.value = false
        }
    }

    // ── State ─────────────────────────────────────────────────────────────────

    val hasWorkInProgress: Boolean get() = workCount.get() > 0

    fun resetState() {
        _state.value = SyncState.Idle
    }

    private fun isFirstOfMonth(): Boolean {
        val cal = java.util.Calendar.getInstance()
        return cal.get(java.util.Calendar.DAY_OF_MONTH) == 1
    }

    companion object {
        fun build(
            r24Dao: R24Dao,
            db: SeraphDb,
            aggregationRunner: AggregationRunner,
            scope: CoroutineScope,
            onMonthRollover: (() -> Unit)? = null,
            notificationWriter: NotificationWriter? = null,
        ) = WorkOrchestrator(
            aggregationRunner = aggregationRunner,
            r24Dao = r24Dao,
            db = db,
            scope = scope,
            onMonthRollover = onMonthRollover,
            notificationWriter = notificationWriter,
        )
    }
}
