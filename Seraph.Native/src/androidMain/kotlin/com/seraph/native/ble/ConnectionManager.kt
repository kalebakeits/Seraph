package com.seraph.native.ble

import android.content.Context
import co.touchlab.kermit.Logger
import com.seraph.native.sync.CommandChannel
import com.seraph.native.sync.ConnectionState
import com.seraph.native.sync.Device
import com.seraph.native.sync.WorkOrchestrator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

private val log = Logger.withTag("ConnectionManager")

/**
 * Owns the single [BleManagerImpl] instance for the lifetime of the service.
 * Responsible for:
 *  - connect / disconnect / scan
 *  - auto-reconnect on unexpected BLE drop
 *  - routing raw notifications to [WorkOrchestrator]
 *  - exposing [ConnectionState] flow to the rest of the system
 *
 * [Device] and [WorkOrchestrator] are created here on first connect and
 * reused for the lifetime of the connection (singletons per session).
 */
class ConnectionManager(
    context: Context,
    private val scope: CoroutineScope,
    private val onConnected: (Device, CommandChannel, WorkOrchestrator) -> Unit,
    private val onDisconnected: () -> Unit,
    private val buildOrchestrator: (Device, CommandChannel) -> WorkOrchestrator,
) {
    private val ble = BleManagerImpl(context)

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private var deviceId: String = ""
    private var collectJob: Job? = null
    private var disconnectWatchJob: Job? = null

    // Singletons for the current session — recreated on each fresh connect()
    var commandChannel: CommandChannel? = null
        private set
    var device: Device? = null
        private set
    var orchestrator: WorkOrchestrator? = null
        private set

    // ── Public API ────────────────────────────────────────────────────────────

    fun start(id: String) {
        if (deviceId == id && _connectionState.value is ConnectionState.Connected) {
            log.w { "start() called but already connected to $id" }
            return
        }
        deviceId = id
        scope.launch { connectInternal() }
        scope.launch {
            ble.adapterRestored.collect {
                if (_connectionState.value !is ConnectionState.Connected) {
                    log.i { "Bluetooth restored — retrying connection to $deviceId" }
                    connectInternal()
                }
            }
        }
    }

    suspend fun disconnect() {
        disconnectWatchJob?.cancel()
        collectJob?.cancel()
        ble.disconnect()
        teardownSession()
        _connectionState.value = ConnectionState.Disconnected
    }

    suspend fun scan() = ble.scan()

    suspend fun stopScan() = ble.stopScan()

    // ── Internal ──────────────────────────────────────────────────────────────

    private suspend fun connectInternal() {
        if (_connectionState.value is ConnectionState.Connecting) return
        _connectionState.value = ConnectionState.Connecting
        log.i { "Connecting to $deviceId" }

        try {
            ble.connect(deviceId) // useAutoConnect(true) — suspends until connected, OS handles reconnect
            setupSession()
            _connectionState.value = ConnectionState.Connected
            log.i { "Connected to $deviceId" }
            watchForDisconnect()
        } catch (e: Exception) {
            log.e(e) { "Connection failed" }
            _connectionState.value = ConnectionState.Error(e.message ?: "Connection failed")
        }
    }

    private fun setupSession() {
        val ch = CommandChannel(ble)
        val dev = Device(ch)
        val orc = buildOrchestrator(dev, ch)
        commandChannel = ch
        device = dev
        orchestrator = orc

        collectJob?.cancel()
        collectJob =
            scope.launch(Dispatchers.Default) {
                ble.notifications.collect { raw -> orc.onNotification(raw) }
            }

        onConnected(dev, ch, orc)
    }

    private fun teardownSession() {
        collectJob?.cancel()
        collectJob = null
        orchestrator?.resetState()
        commandChannel = null
        device = null
        orchestrator = null
        onDisconnected()
    }

    private fun watchForDisconnect() {
        disconnectWatchJob?.cancel()
        disconnectWatchJob =
            scope.launch {
                ble.disconnects.collect {
                    log.i { "BLE drop — tearing down session, waiting for strap to re-advertise" }
                    _connectionState.value = ConnectionState.Disconnected
                    teardownSession()
                    if (deviceId.isNotEmpty()) {
                        try {
                            connectInternal()
                        } catch (e: Exception) {
                            log.e(e) { "Reconnect attempt failed" }
                            _connectionState.value = ConnectionState.Error(e.message ?: "Reconnect failed")
                        }
                    }
                }
            }
    }
}
