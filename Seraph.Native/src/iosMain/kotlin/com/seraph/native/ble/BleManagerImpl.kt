package com.seraph.native.ble

import com.seraph.native.sync.BleManager
import com.seraph.native.sync.BleScannedDevice
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow

/** CoreBluetooth stub — full Swift implementation pending. */
class BleManagerImpl : BleManager {
    override val notifications: Flow<ByteArray> = emptyFlow()
    override val disconnects: Flow<Unit> = emptyFlow()
    override val adapterRestored: Flow<Unit> = emptyFlow()

    override suspend fun scan(): List<BleScannedDevice> = emptyList()

    override suspend fun stopScan() = Unit

    override suspend fun connect(deviceId: String) = Unit

    override suspend fun disconnect() = Unit

    override suspend fun write(data: ByteArray) = Unit
}
