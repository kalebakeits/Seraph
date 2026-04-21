package com.seraph.native.sync

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * Pure token dispenser. Tracks whether any work is in progress.
 * Runners acquire a [Token] when work starts and release it when done.
 */
class WorkOrchestrator {
    private val tokenCount = AtomicInteger(0)
    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    fun acquireToken(): Token {
        tokenCount.incrementAndGet()
        _busy.value = true
        return Token(this)
    }

    internal fun releaseToken() {
        if (tokenCount.decrementAndGet() == 0) _busy.value = false
    }

    class Token(
        private val source: WorkOrchestrator,
    ) {
        private val released = AtomicBoolean(false)

        fun release() {
            if (released.compareAndSet(false, true)) source.releaseToken()
        }
    }
}
