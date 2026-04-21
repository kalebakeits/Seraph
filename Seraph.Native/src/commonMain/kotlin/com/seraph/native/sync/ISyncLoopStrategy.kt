package com.seraph.native.sync

/**
 * Determines sync cadence and post-sync behaviour for the sync loop.
 *
 * Implementations:
 * - [NormalSyncStrategy] — standard 15-minute background sync.
 * - [NapSyncStrategy]   — 60-second cadence with nap goal detection after each sync.
 */
interface ISyncLoopStrategy {
    /** How long to wait between syncs (milliseconds). */
    val intervalMs: Long

    /**
     * Called by [SyncLoopWorker] after each successful sync completes.
     * The strategy may inspect DB state, send device commands, and switch the worker's
     * own strategy via [worker.setStrategy] when its job is done.
     */
    suspend fun onSyncComplete(
        worker: ISyncLoopWorker,
        date: String,
    )
}
