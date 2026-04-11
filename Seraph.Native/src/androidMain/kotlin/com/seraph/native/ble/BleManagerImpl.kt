package com.seraph.native.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import co.touchlab.kermit.Logger
import com.seraph.native.sync.BleManager
import com.seraph.native.sync.BleScannedDevice
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import no.nordicsemi.android.ble.ktx.suspend
import no.nordicsemi.android.ble.observer.ConnectionObserver
import java.util.UUID
import no.nordicsemi.android.ble.BleManager as NordicBleManager

private val log = Logger.withTag("BleManagerImpl")

// ── UUIDs ─────────────────────────────────────────────────────────────────────
private val SERVICE_UUID = UUID.fromString("61080001-8d6d-82b8-614a-1c8cb0f8dcc6")
private val CMD_TO_STRAP_UUID = UUID.fromString("61080002-8d6d-82b8-614a-1c8cb0f8dcc6")
private val CMD_FROM_STRAP_UUID = UUID.fromString("61080003-8d6d-82b8-614a-1c8cb0f8dcc6")
private val EVENTS_FROM_UUID = UUID.fromString("61080004-8d6d-82b8-614a-1c8cb0f8dcc6")
private val DATA_FROM_UUID = UUID.fromString("61080005-8d6d-82b8-614a-1c8cb0f8dcc6")

@SuppressLint("MissingPermission")
class BleManagerImpl(
    private val appContext: Context,
) : BleManager {
    private val _notifications = MutableSharedFlow<ByteArray>(extraBufferCapacity = 2048)
    override val notifications: Flow<ByteArray> = _notifications.asSharedFlow()

    private val _disconnects = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    override val disconnects: Flow<Unit> = _disconnects.asSharedFlow()

    private val _adapterRestored = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    override val adapterRestored: Flow<Unit> = _adapterRestored.asSharedFlow()

    private var nordicMgr: NordicManager? = null

    private val adapterStateReceiver =
        object : BroadcastReceiver() {
            override fun onReceive(
                context: Context,
                intent: Intent,
            ) {
                when (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)) {
                    BluetoothAdapter.STATE_ON -> {
                        log.i { "Bluetooth adapter on — emitting adapterRestored" }
                        _adapterRestored.tryEmit(Unit)
                    }
                    BluetoothAdapter.STATE_OFF -> {
                        log.i { "Bluetooth adapter off — emitting disconnect" }
                        nordicMgr?.intentionalClose = true
                        nordicMgr?.close()
                        nordicMgr = null
                        _disconnects.tryEmit(Unit)
                    }
                }
            }
        }

    init {
        appContext.registerReceiver(
            adapterStateReceiver,
            IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED),
        )
    }

    // ── Nordic BleManager subclass ────────────────────────────────────────────

    inner class NordicManager(
        context: Context,
    ) : NordicBleManager(context) {
        var intentionalClose = false

        private var cmdToStrap: BluetoothGattCharacteristic? = null
        private var cmdFromStrap: BluetoothGattCharacteristic? = null
        private var eventsFrom: BluetoothGattCharacteristic? = null
        private var dataFrom: BluetoothGattCharacteristic? = null

        override fun getMinLogPriority(): Int = android.util.Log.DEBUG

        override fun log(
            priority: Int,
            message: String,
        ) {
            log.d { "[Nordic] $message" }
        }

        override fun isRequiredServiceSupported(gatt: BluetoothGatt): Boolean {
            val service =
                gatt.getService(SERVICE_UUID) ?: run {
                    log.e { "strap service not found" }
                    return false
                }
            cmdToStrap = service.getCharacteristic(CMD_TO_STRAP_UUID)
            cmdFromStrap = service.getCharacteristic(CMD_FROM_STRAP_UUID)
            eventsFrom = service.getCharacteristic(EVENTS_FROM_UUID)
            dataFrom = service.getCharacteristic(DATA_FROM_UUID)

            if (cmdToStrap == null) {
                log.e { "CMD_TO_STRAP characteristic not found" }
                return false
            }
            log.i { "All strap characteristics found" }
            return true
        }

        override fun initialize() {
            cmdFromStrap?.let { char ->
                setNotificationCallback(char).with { _, data ->
                    data.value?.let { _notifications.tryEmit(it.copyOf()) }
                }
                enableNotifications(char).enqueue()
            }
            eventsFrom?.let { char ->
                setNotificationCallback(char).with { _, data ->
                    data.value?.let { _notifications.tryEmit(it.copyOf()) }
                }
                enableNotifications(char).enqueue()
            }
            dataFrom?.let { char ->
                setNotificationCallback(char).with { _, data ->
                    data.value?.let { _notifications.tryEmit(it.copyOf()) }
                }
                enableNotifications(char).enqueue()
            }
        }

        override fun onServicesInvalidated() {
            cmdToStrap = null
            cmdFromStrap = null
            eventsFrom = null
            dataFrom = null
        }

        init {
            setConnectionObserver(
                object : ConnectionObserver {
                    override fun onDeviceConnecting(device: android.bluetooth.BluetoothDevice) {}

                    override fun onDeviceConnected(device: android.bluetooth.BluetoothDevice) {}

                    override fun onDeviceFailedToConnect(
                        device: android.bluetooth.BluetoothDevice,
                        reason: Int,
                    ) {}

                    override fun onDeviceReady(device: android.bluetooth.BluetoothDevice) {}

                    override fun onDeviceDisconnecting(device: android.bluetooth.BluetoothDevice) {}

                    override fun onDeviceDisconnected(
                        device: android.bluetooth.BluetoothDevice,
                        reason: Int,
                    ) {
                        log.i {
                            "Device disconnected: reason=$reason intentionalClose=$intentionalClose"
                        }
                        if (!intentionalClose) _disconnects.tryEmit(Unit)
                    }
                },
            )
        }

        // Expose write as a public suspend method so the outer class can call it.
        suspend fun writeCmd(data: ByteArray) {
            val char = cmdToStrap ?: throw IllegalStateException("CMD_TO_STRAP not available")
            writeCharacteristic(char, data, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
                .suspend()
        }
    }

    // ── BleManager impl ─────────────────────────────────────────────────

    private val scanResults = mutableMapOf<String, BleScannedDevice>()

    override suspend fun scan(): List<BleScannedDevice> {
        scanResults.clear()
        val adapter =
            (
                appContext.getSystemService(
                    Context.BLUETOOTH_SERVICE,
                ) as android.bluetooth.BluetoothManager
            ).adapter
        val scanner = adapter.bluetoothLeScanner ?: return emptyList()

        val filter =
            android.bluetooth.le.ScanFilter
                .Builder()
                .setServiceUuid(android.os.ParcelUuid.fromString("61080001-8d6d-82b8-614a-1c8cb0f8dcc6"))
                .build()
        val settings =
            android.bluetooth.le.ScanSettings
                .Builder()
                .setScanMode(android.bluetooth.le.ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build()

        val callback =
            object : android.bluetooth.le.ScanCallback() {
                override fun onScanResult(
                    callbackType: Int,
                    result: android.bluetooth.le.ScanResult,
                ) {
                    val d = BleScannedDevice(result.device.address, result.device.name, result.rssi)
                    scanResults[d.address] = d
                }
            }

        scanner.startScan(listOf(filter), settings, callback)
        delay(10_000)
        scanner.stopScan(callback)
        return scanResults.values.toList()
    }

    override suspend fun stopScan() {
        scanResults.clear()
    }

    override suspend fun connect(deviceId: String) {
        if (nordicMgr?.isConnected == true) {
            log.w { "connect() called but already connected — ignoring" }
            return
        }
        nordicMgr?.intentionalClose = true
        nordicMgr?.close()

        val mgr = NordicManager(appContext)
        nordicMgr = mgr

        val adapter =
            (
                appContext.getSystemService(
                    Context.BLUETOOTH_SERVICE,
                ) as android.bluetooth.BluetoothManager
            ).adapter
        val device = adapter.getRemoteDevice(deviceId)

        mgr
            .connect(device)
            .retry(3, 200)
            .useAutoConnect(true)
            .suspend()

        log.i { "Connected to $deviceId via Nordic BLE" }
    }

    override suspend fun disconnect() {
        val mgr = nordicMgr ?: return
        mgr.intentionalClose = true
        try {
            if (mgr.isConnected) mgr.disconnect().suspend()
        } catch (e: Exception) {
            log.w(e) { "disconnect() threw — ignoring (BLE may be off)" }
        } finally {
            mgr.close()
            nordicMgr = null
        }
    }

    override suspend fun write(data: ByteArray) {
        val mgr = nordicMgr ?: throw IllegalStateException("Not connected")
        mgr.writeCmd(data)
    }
}
