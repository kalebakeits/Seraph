@file:OptIn(kotlin.time.ExperimentalTime::class, kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.AggregationRunner
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.parsers.PacketRouter
import com.seraph.native.protocol.Commands
import com.seraph.native.protocol.Framing
import com.seraph.native.protocol.PacketMetadata
import com.seraph.native.protocol.PacketType
import com.seraph.native.protocol.R24Packet
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.time.Clock

private val log = Logger.withTag("SyncRunner")

data class DeviceEvent(
    val eventNum: Byte,
    val payload: ByteArray,
)

/**
 * Owns BLE sync, aggregation state, and device state cache.
 * Receives raw BLE notifications via [onNotification].
 */
class SyncRunner(
    private val orchestrator: WorkOrchestrator,
    private val r24Dao: R24Dao,
    private val db: SeraphDb,
    private val aggregationRunner: AggregationRunner,
    private val scope: CoroutineScope,
    private val onMonthRollover: (() -> Unit)? = null,
) {
    // BLE dependencies — set on attachBle
    lateinit var device: Device
        private set
    lateinit var commandChannel: CommandChannel
        private set
    private lateinit var packetRouter: PacketRouter
    private var onRawHistoricalPacket: ((type: String, raw: ByteArray) -> Unit)? = null
    private var onRealtimeHR: ((hr: Int) -> Unit)? = null

    // In-memory device state cache
    @Volatile var cachedBattery: Double? = null

    @Volatile var cachedOnWrist: Boolean? = null

    @Volatile var cachedCharging: Boolean? = null

    @Volatile var cachedAlarm: Int? = null

    private val _state = MutableStateFlow<SyncState>(SyncState.Idle)
    val state: StateFlow<SyncState> = _state.asStateFlow()

    private val metadataChannel = Channel<PacketMetadata>(capacity = 32)

    private val _deviceEvents = MutableSharedFlow<DeviceEvent>(extraBufferCapacity = 64)
    val deviceEvents: SharedFlow<DeviceEvent> = _deviceEvents.asSharedFlow()

    private val _realtimeHR = MutableSharedFlow<Int>(extraBufferCapacity = 64)
    val realtimeHR: SharedFlow<Int> = _realtimeHR.asSharedFlow()

    private val _trimAcked = MutableSharedFlow<Int>(extraBufferCapacity = 16)
    val trimAcked: SharedFlow<Int> = _trimAcked.asSharedFlow()

    fun hasDevice(): Boolean = ::device.isInitialized

    @Volatile private var activeSession: SyncSession? = null

    @Volatile private var syncJob: Job? = null

    @Volatile private var syncing = false

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

    suspend fun onConnectReady(checkAlarm: suspend () -> Unit) {
        val token = orchestrator.acquireToken()
        try {
            fetchDeviceState()
            checkAlarm()
            requestSync()
        } finally {
            token.release()
        }
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
            cachedAlarm = device.getAlarm()
        } catch (_: Exception) {
        }
    }

    fun onNotification(raw: ByteArray) {
        if (raw.size < 5) {
            log.w { "Packet too short (${raw.size}b)" }
            return
        }
        val parsed = Framing.parsePacket(raw)
        if (parsed.status == Framing.ParseStatus.CRC_FAILED) {
            log.w { "CRC failure on incoming packet — requesting batch retry" }
            activeSession?.markBatchCorrupt()
            return
        }
        if (!parsed.valid || parsed.payload == null) {
            log.w { "Frame invalid" }
            return
        }
        val payload = parsed.payload
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
                if (payload.size >= 9) {
                    val hr = payload[8].toInt() and 0xFF
                    _realtimeHR.tryEmit(hr)
                    onRealtimeHR?.invoke(hr)
                }
            }
            else -> log.d { "Unhandled payload type 0x${payload[0].toInt().and(0xFF).toString(16)}" }
        }
    }

    suspend fun requestSync(lastTrim: Int? = null) {
        if (syncing || aggregationRunner.isRunning) {
            log.d { "requestSync ignored — already syncing or aggregating" }
            return
        }
        syncJob = currentCoroutineContext()[Job]
        syncing = true
        val token = orchestrator.acquireToken()
        try {
            val nowSec = (Clock.System.now().toEpochMilliseconds() / 1000).toInt()
            device.setClock(nowSec)

            if (lastTrim != null) commandChannel.send(Commands.forceTrim(lastTrim))

            _state.value = SyncState.Syncing(0)
            while (!metadataChannel.isEmpty) metadataChannel.tryReceive()

            val granularityMs = r24Dao.loadGranularityMs(db)
            val session = SyncSession(commandChannel, metadataChannel, r24Dao, aggregationRunner, scope, granularityMs)
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
                "Sync complete — ${result.dates.size} date(s): ${result.dates.sorted()}, " +
                    "${result.closedActivityStartTs.size} closed activities, " +
                    "${result.newSleepStartTs.size} new sleep, lastTrim=${result.lastTrim}"
            }
            _state.value = SyncState.Complete(result.dates, result.closedActivityStartTs, result.newSleepStartTs)

            if (isFirstOfMonth()) {
                scope.launch(Dispatchers.Default) {
                    try {
                        onMonthRollover?.invoke()
                    } catch (e: Exception) {
                        log.e(e) { "Month rollover failed" }
                    }
                }
            }
        } catch (e: Exception) {
            activeSession = null
            log.e(e) { "Sync error" }
            _state.value = SyncState.Error(e.message ?: "Sync error")
        } finally {
            syncing = false
            token.release()
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

    fun resetState() {
        _state.value = SyncState.Idle
    }

    private fun isFirstOfMonth(): Boolean {
        val cal = java.util.Calendar.getInstance()
        return cal.get(java.util.Calendar.DAY_OF_MONTH) == 1
    }
}
