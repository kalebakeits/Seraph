package com.seraph.native.ble

import android.content.Context
import co.touchlab.kermit.Logger
import com.seraph.native.sync.CommandChannel
import com.seraph.native.sync.ConnectionState
import com.seraph.native.sync.Device
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
 * Responsible for connect / disconnect / scan, auto-reconnect, and routing raw
 * notifications via [onNotification].
 *
 * [onBleReady] is called on each successful connect with the live [Device] and
 * [CommandChannel]. [onNotification] must be set before connect to receive packets.
 */
class ConnectionManager(
    context: Context,
    private val scope: CoroutineScope,
    private val onBleReady: (Device, CommandChannel) -> Unit,
    private val onConnected: (Device, CommandChannel) -> Unit,
    private val onDisconnected: () -> Unit,
    val onNotification: ((ByteArray) -> Unit)? = null,
) {
    private val ble = BleManagerImpl(context)

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private var deviceId: String = ""
    private var collectJob: Job? = null
    private var disconnectWatchJob: Job? = null

    var commandChannel: CommandChannel? = null
        private set
    var device: Device? = null
        private set

    fun start(id: String) {
        if (deviceId == id && _connectionState.value is ConnectionState.Connected) {
            val dev = device
            val ch = commandChannel
            if (dev != null && ch != null) {
                log.i { "start() called while already connected — re-notifying onConnected" }
                onConnected(dev, ch)
            }
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

    private suspend fun connectInternal() {
        if (_connectionState.value is ConnectionState.Connecting) return
        _connectionState.value = ConnectionState.Connecting
        log.i { "Connecting to $deviceId" }
        try {
            ble.connect(deviceId)
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
        commandChannel = ch
        device = dev

        onBleReady(dev, ch)

        collectJob?.cancel()
        collectJob =
            scope.launch(Dispatchers.Default) {
                ble.notifications.collect { raw -> onNotification?.invoke(raw) }
            }

        onConnected(dev, ch)
    }

    private fun teardownSession() {
        collectJob?.cancel()
        collectJob = null
        commandChannel = null
        device = null
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
