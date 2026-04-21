@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.sync

import co.touchlab.kermit.Logger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.LocalDate

private val log = Logger.withTag("SyncLoopWorker")

private const val TICK_MS = 5_000L
private const val RETRY_BACKOFF_MS = 30_000L

/**
 * Runs the periodic sync loop using a pluggable [ISyncLoopStrategy].
 *
 * The strategy controls the interval between syncs and any post-sync side effects
 * (e.g. nap goal detection). Calling [setStrategy] replaces the active strategy and
 * restarts the loop so the new interval takes effect immediately.
 *
 * The orchestrator that owns this worker supplies lambdas so this class
 * stays decoupled from [WorkOrchestrator] internals.
 *
 * @param isBusy Returns true when a sync or aggregation is already in progress.
 * @param sync   Performs a single sync cycle (suspends until complete).
 */
class SyncLoopWorker(
    private val scope: CoroutineScope,
    private val isBusy: () -> Boolean,
    private val sync: suspend () -> Unit,
) : ISyncLoopWorker {
    @Volatile private var strategy: ISyncLoopStrategy = NormalSyncStrategy
    private var job: Job? = null

    @Volatile private var immediate = false

    fun start() {
        if (job?.isActive == true) return
        log.i { "SyncLoop starting (strategy=${strategy::class.simpleName}, interval=${strategy.intervalMs / 1000}s)" }
        job =
            scope.launch {
                var nextSync = System.currentTimeMillis() + strategy.intervalMs
                while (isActive) {
                    delay(TICK_MS)
                    if (isBusy()) continue
                    if (!shouldSync(nextSync)) continue
                    immediate = false
                    val today = LocalDate.now().toString()
                    try {
                        log.i { "Auto-sync triggering" }
                        sync()
                        strategy.onSyncComplete(this@SyncLoopWorker, today)
                        nextSync = System.currentTimeMillis() + strategy.intervalMs
                    } catch (e: Exception) {
                        log.e(e) { "Auto-sync failed — backing off ${RETRY_BACKOFF_MS / 1000}s" }
                        nextSync = System.currentTimeMillis() + RETRY_BACKOFF_MS
                    }
                }
            }
    }

    fun stop() {
        job?.cancel()
        job = null
        log.i { "SyncLoop stopped" }
    }

    fun triggerImmediately() {
        immediate = true
    }

    /**
     * Replaces the active strategy and restarts the loop so the new interval applies now.
     * Safe to call from within [ISyncLoopStrategy.onSyncComplete].
     */
    override fun setStrategy(newStrategy: ISyncLoopStrategy) {
        if (strategy === newStrategy) return
        log.i { "Strategy → ${newStrategy::class.simpleName} (interval=${newStrategy.intervalMs / 1000}s)" }
        strategy = newStrategy
        stop()
        start()
    }

    private fun shouldSync(nextSync: Long): Boolean {
        val state = immediate || System.currentTimeMillis() >= nextSync
        return state
    }
}
