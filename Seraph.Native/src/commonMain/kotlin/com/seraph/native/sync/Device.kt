package com.seraph.native.sync

import com.seraph.native.protocol.CommandNumber
import com.seraph.native.protocol.Commands
import com.seraph.native.protocol.ResponseParser

/**
 * All fire-and-forget / request-response device commands.
 * Singleton — one instance per BLE connection, created by ConnectionManager.
 */
class Device(
    private val commandChannel: CommandChannel,
) {
    // TODO: Investigate whether GET_BATTERY_LEVEL (0x1a) is actually answered by the strap.
    // Logcat shows 10s timeouts on cmd 0x1a. If the strap doesn't respond, consider using
    // the BATTERY_LEVEL push event instead (EventNumber.BATTERY_LEVEL), or deriving battery
    // from GET_HELLO_HARVARD if a reliable offset can be found (currently Harvard only
    // surfaces charging/onWrist at bytes 10 and 119).
    suspend fun getBattery() =
        commandChannel
            .sendAndAwaitQueued(Commands.getBatteryLevel(), CommandNumber.GET_BATTERY_LEVEL)
            .let { ResponseParser.parseBattery(it) }

    suspend fun getVersion() =
        commandChannel
            .sendAndAwaitQueued(Commands.getVersionInfo(), CommandNumber.REPORT_VERSION_INFO)
            .let { ResponseParser.parseVersionInfo(it) }

    suspend fun getHello() =
        commandChannel
            .sendAndAwaitQueued(Commands.getHelloHarvard(), CommandNumber.GET_HELLO_HARVARD)
            .let { ResponseParser.parseHelloHarvard(it) }

    suspend fun getClock() =
        commandChannel
            .sendAndAwaitQueued(Commands.getClock(), CommandNumber.GET_CLOCK)
            .let { ResponseParser.parseClock(it) }

    suspend fun setClock(sec: Int) {
        commandChannel.sendQueued(Commands.setClock(sec))
    }

    suspend fun getAlarm() =
        commandChannel
            .sendAndAwaitQueued(Commands.getAlarmTime(), CommandNumber.GET_ALARM_TIME)
            .let { ResponseParser.parseAlarmTime(it) }

    suspend fun setAlarm(sec: Int) {
        commandChannel.sendQueued(Commands.setAlarmTime(sec))
    }

    suspend fun disableAlarm() {
        commandChannel.sendQueued(Commands.disableAlarm())
    }

    suspend fun vibrate() {
        commandChannel.sendQueued(Commands.runAlarm())
    }

    suspend fun haptic() {
        commandChannel.sendQueued(Commands.runHaptics())
    }

    suspend fun reboot() {
        commandChannel.sendImmediate(Commands.reboot())
    }

    suspend fun toggleRealtimeHR(enable: Boolean) {
        commandChannel.sendQueued(Commands.toggleRealtimeHR(enable))
    }

    suspend fun eraseAllData() {
        commandChannel.sendImmediate(Commands.abortHistoricalTransmits())
        commandChannel.sendImmediate(Commands.eraseAllData())
    }

    suspend fun forceTrim(trimValue: Int) {
        commandChannel.send(Commands.abortHistoricalTransmits())
        commandChannel.send(Commands.forceTrim(trimValue))
    }
}
