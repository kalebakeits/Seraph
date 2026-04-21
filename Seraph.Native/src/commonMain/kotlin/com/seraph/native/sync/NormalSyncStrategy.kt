package com.seraph.native.sync

private const val NORMAL_INTERVAL_MS = 15L * 60 * 1000

/**
 * Standard background sync cadence. No post-sync side effects.
 */
object NormalSyncStrategy : ISyncLoopStrategy {
    override val intervalMs: Long = NORMAL_INTERVAL_MS

    override suspend fun onSyncComplete(
        worker: ISyncLoopWorker,
        date: String,
    ) {
        // Nothing to do after a normal sync.
    }
}
