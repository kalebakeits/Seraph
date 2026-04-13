package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb

private val log = Logger.withTag("NapSyncStrategy")

private const val NAP_INTERVAL_MS = 60L * 1000

/**
 * Fast sync cadence for smart nap mode.
 *
 * After each sync, checks whether the user has accumulated the target amount of actual
 * sleep (excluding awake minutes). On goal met: fires a haptic on the device, clears nap
 * state from app_parameters, re-syncs the regular alarm, and transitions the worker back
 * to [NormalSyncStrategy].
 */
class NapSyncStrategy(
    private val db: SeraphDb,
    private val device: Device,
) : ISyncLoopStrategy {
    override val intervalMs: Long = NAP_INTERVAL_MS

    override suspend fun onSyncComplete(
        worker: ISyncLoopWorker,
        date: String,
    ) {
        val targetMs =
            db.seraphDbQueries
                .getAppParameter("nap_active_duration_ms")
                .executeAsOneOrNull()
                ?.toLongOrNull()
                ?: run {
                    // Nap state cleared externally (e.g. user cancelled) — return to normal.
                    worker.setStrategy(NormalSyncStrategy)
                    return
                }

        val napSession =
            db.seraphDbQueries
                .getOpenNapSleep(date)
                .executeAsList()
                .firstOrNull { it.is_manual == 3L }
                ?: return // Smart nap session not yet open — keep waiting.

        // start_ts = 0 means onset not yet detected. Don't count pre-sleep time.
        if (napSession.start_ts == 0L) return

        val actualSleepMs =
            (napSession.end_ts - napSession.start_ts) -
                (napSession.awake_minutes * 60_000L)

        log.d { "Nap check: ${actualSleepMs / 60000}min sleep / ${targetMs / 60000}min target" }

        if (actualSleepMs < targetMs) return

        log.i { "Nap goal reached — firing haptic and restoring normal sync" }
        try {
            device.haptic()
        } catch (e: Exception) {
            log.w(e) { "Haptic command failed" }
        }

        clearNapState()
        restoreRegularAlarm()
        worker.setStrategy(NormalSyncStrategy)
    }

    private fun clearNapState() {
        db.seraphDbQueries.deleteAppParameter("nap_active_duration_ms")
        db.seraphDbQueries.deleteAppParameter("nap_hard_cutoff_sec")
        db.seraphDbQueries.deleteAppParameter("nap_mode")
        log.d { "Nap state cleared from app_parameters" }
    }

    private suspend fun restoreRegularAlarm() {
        try {
            val alarmChecker = AlarmChecker(db)
            when (val action = alarmChecker.check(deviceAlarmSec = null, isConnected = true)) {
                is AlarmChecker.AlarmAction.SetAlarm -> {
                    log.i { "Restoring regular alarm to ${action.unixSec}" }
                    device.setAlarm(action.unixSec)
                }
                else -> {}
            }
        } catch (e: Exception) {
            log.w(e) { "Post-nap alarm restore failed — will sync on next connect" }
        }
    }
}
