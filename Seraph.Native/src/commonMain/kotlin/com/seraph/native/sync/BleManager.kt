package com.seraph.native.sync

import kotlinx.coroutines.flow.Flow

/**
 * Platform-agnostic BLE interface. Implemented per-platform in androidMain / iosMain.
 */
data class BleScannedDevice(
    val address: String,
    val name: String?,
    val rssi: Int,
)

interface BleManager {
    /** Scan for strap devices. Returns results after timeout. */
    suspend fun scan(): List<BleScannedDevice>

    /** Stop an in-progress scan early. */
    suspend fun stopScan()

    /** Connect to a device by its address/UUID. */
    suspend fun connect(deviceId: String)

    /** Disconnect the current device. */
    suspend fun disconnect()

    /** Send raw bytes to the device write characteristic. */
    suspend fun write(data: ByteArray)

    /** Flow of raw notification payloads from the device. */
    val notifications: Flow<ByteArray>

    /** Emits Unit whenever the device disconnects unexpectedly. */
    val disconnects: Flow<Unit>

    /** Emits Unit when the Bluetooth adapter turns back on after being disabled. */
    val adapterRestored: Flow<Unit>
}
