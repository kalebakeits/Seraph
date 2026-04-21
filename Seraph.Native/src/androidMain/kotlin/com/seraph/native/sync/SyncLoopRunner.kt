package com.seraph.native.sync

import kotlinx.coroutines.CoroutineScope

/**
 * Owns the [SyncLoopWorker] instance and exposes start/stop/trigger/strategy controls.
 */
class SyncLoopRunner(
    scope: CoroutineScope,
    isBusy: () -> Boolean,
    sync: suspend () -> Unit,
) {
    private val worker = SyncLoopWorker(scope = scope, isBusy = isBusy, sync = sync)

    fun start() = worker.start()

    fun stop() = worker.stop()

    fun triggerImmediately() = worker.triggerImmediately()

    fun setStrategy(strategy: ISyncLoopStrategy) = worker.setStrategy(strategy)
}
