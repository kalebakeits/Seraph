package com.seraph.native.sync

/**
 * Minimal interface exposed to [ISyncLoopStrategy] implementations.
 * Strategies call [setStrategy] to hand off control (e.g. nap goal met → normal sync).
 */
interface ISyncLoopWorker {
    fun setStrategy(newStrategy: ISyncLoopStrategy)
}
