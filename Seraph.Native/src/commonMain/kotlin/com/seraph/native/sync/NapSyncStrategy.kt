@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.time.Clock

private val log = Logger.withTag("NapSyncStrategy")

private const val NAP_INTERVAL_MS = 60L * 1000

/**
 * Fast sync cadence for smart nap mode.
 *
 * Terminates when the sleep goal is reached, the hard cutoff time passes, or [cancel] is called.
 * In all cases [onComplete] fires exactly once.
 */
class NapSyncStrategy(
    private val db: SeraphDb,
    private val device: Device,
    private val onComplete: () -> Unit,
    private val onSleepOnset: ((startTs: Long) -> Unit)? = null,
) : ISyncLoopStrategy {
    override val intervalMs: Long = NAP_INTERVAL_MS

    private val completed = AtomicBoolean(false)
    private val onsetFired = AtomicBoolean(false)

    @Volatile private var cancelled = false

    fun cancel() {
        cancelled = true
    }

    override suspend fun onSyncComplete(
        worker: ISyncLoopWorker,
        date: String,
    ) {
        if (cancelled) {
            finish(worker)
            return
        }

        val cutoffSec =
            db.seraphDbQueries
                .getAppParameter("nap_hard_cutoff_sec")
                .executeAsOneOrNull()
                ?.toLongOrNull()

        val nowSec = Clock.System.now().toEpochMilliseconds() / 1000
        if (cutoffSec != null && nowSec >= cutoffSec) {
            log.i { "Nap hard cutoff reached" }
            clearNapState()
            restoreRegularAlarm()
            finish(worker)
            return
        }

        val mode = db.seraphDbQueries.getAppParameter("nap_mode").executeAsOneOrNull()
        if (mode == "manual") return

        val targetMs =
            db.seraphDbQueries
                .getAppParameter("nap_active_duration_ms")
                .executeAsOneOrNull()
                ?.toLongOrNull()
                ?: run {
                    finish(worker)
                    return
                }

        val napSession =
            db.seraphDbQueries
                .getOpenNapSleep(date)
                .executeAsList()
                .firstOrNull { it.is_manual == 3L }
                ?: return

        if (napSession.start_ts == 0L) return

        if (onsetFired.compareAndSet(false, true)) {
            onSleepOnset?.invoke(napSession.start_ts)
        }

        val actualSleepMs =
            (napSession.end_ts - napSession.start_ts) -
                (napSession.awake_minutes * 60_000L)

        log.d { "Nap check: ${actualSleepMs / 60000}min sleep / ${targetMs / 60000}min target" }

        if (actualSleepMs < targetMs) return

        log.i { "Nap goal reached — firing haptic" }
        try {
            device.haptic()
        } catch (e: Exception) {
            log.w(e) { "Haptic failed" }
        }

        clearNapState()
        restoreRegularAlarm()
        finish(worker)
    }

    private fun finish(worker: ISyncLoopWorker) {
        if (completed.compareAndSet(false, true)) onComplete()
        worker.setStrategy(NormalSyncStrategy)
    }

    private fun clearNapState() {
        db.seraphDbQueries.deleteAppParameter("nap_active_duration_ms")
        db.seraphDbQueries.deleteAppParameter("nap_hard_cutoff_sec")
        db.seraphDbQueries.deleteAppParameter("nap_mode")
    }

    private suspend fun restoreRegularAlarm() {
        try {
            val alarmChecker = AlarmChecker(db)
            when (val action = alarmChecker.check(deviceAlarmSec = null, isConnected = true)) {
                is AlarmChecker.AlarmAction.SetAlarm -> device.setAlarm(action.unixSec)
                else -> {}
            }
        } catch (e: Exception) {
            log.w(e) { "Post-nap alarm restore failed" }
        }
    }
}
