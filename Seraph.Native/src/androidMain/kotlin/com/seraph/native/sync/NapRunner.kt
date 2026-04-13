@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb
import kotlin.time.Clock

private val log = Logger.withTag("NapRunner")

/**
 * Owns nap mode lifecycle. Acquires a [WorkOrchestrator.Token] for the full duration
 * of the nap so the service stays alive. The token is released by [NapSyncStrategy]
 * via [onComplete] — either on goal met, hard cutoff, or after [cancel] is signalled.
 */
class NapRunner(
    private val orchestrator: WorkOrchestrator,
    private val db: SeraphDb,
    private val syncLoopRunner: SyncLoopRunner,
) {
    var onSleepOnset: ((startTs: Long) -> Unit)? = null

    @Volatile private var activeStrategy: NapSyncStrategy? = null

    fun onAttachBle(device: Device) {
        val napMode = db.seraphDbQueries.getAppParameter("nap_mode").executeAsOneOrNull()
        val cutoffSec =
            db.seraphDbQueries
                .getAppParameter("nap_hard_cutoff_sec")
                .executeAsOneOrNull()
                ?.toLongOrNull()
        val nowSec = Clock.System.now().toEpochMilliseconds() / 1000
        when {
            napMode.isNullOrEmpty() -> {}
            cutoffSec != null && cutoffSec > nowSec -> {
                log.i { "Resuming nap mode on reconnect" }
                startStrategy(device)
            }
            else -> {
                log.i { "Stale nap state on reconnect — clearing" }
                clearDb()
            }
        }
    }

    fun start(device: Device) {
        log.i { "Nap mode: starting" }
        startStrategy(device)
    }

    fun cancel() {
        log.i { "Nap mode: cancelling" }
        clearDb()
        activeStrategy?.cancel()
    }

    private fun startStrategy(device: Device) {
        val token = orchestrator.acquireToken()
        val strategy =
            NapSyncStrategy(db, device, onComplete = {
                activeStrategy = null
                token.release()
            }, onSleepOnset = { ts -> onSleepOnset?.invoke(ts) })
        activeStrategy = strategy
        syncLoopRunner.setStrategy(strategy)
    }

    private fun clearDb() {
        db.seraphDbQueries.deleteAppParameter("nap_active_duration_ms")
        db.seraphDbQueries.deleteAppParameter("nap_hard_cutoff_sec")
        db.seraphDbQueries.deleteAppParameter("nap_mode")
    }
}
