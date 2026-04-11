package com.seraph.native.sync

import co.touchlab.kermit.Logger
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeout

private val log = Logger.withTag("CommandChannel")

/**
 * Manages BLE writes to the device.
 *
 * The strap stops sending history data if it receives any command
 * mid-transfer. So during sync, user commands are queued and flushed
 * in the gap between HISTORY_END and the ACK.
 *
 * Three write modes:
 * - [send] — direct write, no queuing. Used by sync ACKs and the
 *   sendHistoricalData command itself.
 * - [sendQueued] — fire-and-forget. If sync is active, queued until
 *   [flushQueuedCommands] is called. Otherwise writes immediately.
 *   Used by vibrate, reboot, setClock, setAlarm, etc.
 * - [sendAndAwaitQueued] — write + wait for response. If sync is active,
 *   queued until flush. Otherwise writes immediately and waits.
 *   Used by getBattery, getVersion, getClock, getAlarm, etc.
 *
 * [flushQueuedCommands] is called by SyncSession between HISTORY_END
 * and the ACK — the one window where the device is idle.
 */
class CommandChannel(
    private val ble: BleManager,
) {
    @Volatile
    var syncActive = false

    private data class QueuedCommand(
        val data: ByteArray,
        val cmdNum: Byte?, // null = fire-and-forget
        val deferred: CompletableDeferred<ByteArray>?, // null = fire-and-forget
    )

    private val queue = mutableListOf<QueuedCommand>()
    private val queueLock = Mutex()

    // One CompletableDeferred per pending command, keyed by command number byte
    private val pending = mutableMapOf<Byte, CompletableDeferred<ByteArray>>()

    /**
     * Direct write — bypasses queue, clears any pending queued commands.
     * Used for abort, reboot, eraseAllData — commands that must fire immediately
     * regardless of sync state and make any queued work moot.
     */
    suspend fun sendImmediate(data: ByteArray) {
        queueLock.withLock { queue.clear() }
        log.d { "sendImmediate: ${data.size}b" }
        ble.write(data)
    }

    /**
     * Direct write — no queuing, no sync check.
     * Used only by sync internals: ACKs and sendHistoricalData.
     */
    suspend fun send(data: ByteArray) {
        log.d { "send: ${data.size}b" }
        ble.write(data)
    }

    /**
     * Fire-and-forget write. Queued during sync, immediate otherwise.
     * Used by vibrate, reboot, setClock, setAlarm, etc.
     */
    suspend fun sendQueued(data: ByteArray) {
        if (syncActive) {
            queueLock.withLock {
                log.d { "sendQueued: queued ${data.size}b (sync active)" }
                queue.add(QueuedCommand(data, null, null))
            }
        } else {
            log.d { "sendQueued: writing ${data.size}b (no sync)" }
            ble.write(data)
        }
    }

    /**
     * Write + wait for response. Queued during sync, immediate otherwise.
     * Used by getBattery, getVersion, getClock, getAlarm, etc.
     */
    suspend fun sendAndAwaitQueued(
        data: ByteArray,
        cmdNum: Byte,
        timeoutMs: Long = 10_000,
    ): ByteArray {
        val hex = "0x${cmdNum.toInt().and(0xFF).toString(16).padStart(2, '0')}"
        val deferred = CompletableDeferred<ByteArray>()

        if (syncActive) {
            queueLock.withLock {
                log.d { "sendAndAwaitQueued: queued cmd $hex (sync active)" }
                queue.add(QueuedCommand(data, cmdNum, deferred))
            }
        } else {
            log.d { "sendAndAwaitQueued: writing cmd $hex (no sync)" }
            pending[cmdNum] = deferred
            try {
                ble.write(data)
            } catch (e: Exception) {
                pending.remove(cmdNum)
                throw e
            }
        }

        return try {
            withTimeout(timeoutMs) { deferred.await() }
        } catch (e: Exception) {
            log.w { "Command $hex failed: ${e.message}" }
            throw e
        } finally {
            pending.remove(cmdNum)
        }
    }

    /**
     * Flush only fire-and-forget commands. Called by SyncSession in the gap
     * between HISTORY_END and the ACK, when the device is idle.
     * sendAndAwait commands stay queued — they'll flush at HISTORY_COMPLETE.
     */
    suspend fun flushFireAndForget() {
        val toSend: List<QueuedCommand>
        queueLock.withLock {
            val (ff, rest) = queue.partition { it.cmdNum == null }
            if (ff.isEmpty()) return
            toSend = ff
            queue.clear()
            queue.addAll(rest)
        }

        log.i { "Flushing ${toSend.size} fire-and-forget command(s) (${queue.size} await commands still queued)" }
        for (cmd in toSend) {
            try {
                log.d { "Flush: writing ${cmd.data.size}b fire-and-forget" }
                ble.write(cmd.data)
            } catch (e: Exception) {
                log.w { "Flush: write failed: ${e.message}" }
            }
        }
    }

    /**
     * Flush ALL queued commands (fire-and-forget + sendAndAwait).
     * Called at HISTORY_COMPLETE or on sync error, when sync is done.
     */
    suspend fun flushAll() {
        val snapshot: List<QueuedCommand>
        queueLock.withLock {
            if (queue.isEmpty()) return
            snapshot = queue.toList()
            queue.clear()
        }

        log.i { "Flushing all ${snapshot.size} queued command(s)" }
        for (cmd in snapshot) {
            try {
                if (cmd.cmdNum != null && cmd.deferred != null) {
                    val hex = "0x${cmd.cmdNum.toInt().and(0xFF).toString(16).padStart(2, '0')}"
                    log.d { "Flush: writing cmd $hex and waiting for response" }
                    pending[cmd.cmdNum] = cmd.deferred
                    ble.write(cmd.data)
                } else {
                    log.d { "Flush: writing ${cmd.data.size}b fire-and-forget" }
                    ble.write(cmd.data)
                }
            } catch (e: Exception) {
                log.w { "Flush: write failed: ${e.message}" }
                cmd.deferred?.completeExceptionally(e)
            }
        }
    }

    /** Called by the notification collector when a COMMAND_RESPONSE packet arrives. */
    fun onCommandResponse(
        cmdNum: Byte,
        raw: ByteArray,
    ) {
        val hex = "0x${cmdNum.toInt().and(0xFF).toString(16).padStart(2, '0')}"
        val matched = pending[cmdNum]
        if (matched != null) {
            log.d { "Response matched for cmd $hex (${raw.size}b)" }
            matched.complete(raw)
        } else {
            log.d { "No pending command for $hex" }
        }
    }
}
