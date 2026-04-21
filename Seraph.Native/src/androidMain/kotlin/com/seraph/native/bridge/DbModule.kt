package com.seraph.native.bridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.seraph.native.db.DbBridge
import com.seraph.native.db.DbHolder
import com.seraph.native.db.SnapshotManager
import com.seraph.native.sync.SyncState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class DbModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "DbModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val bridge = DbBridge()
    val snapshotManager = SnapshotManager(reactContext)

    @ReactMethod
    fun getDbReady(promise: Promise) {
        try {
            DbHolder.db
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DB_NOT_READY", e.message, e)
        }
    }

    @ReactMethod
    fun dbQuery(sql: String, params: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                promise.resolve(bridge.query(sql, params))
            } catch (e: Exception) {
                promise.reject("DB_QUERY_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dbExec(sql: String, params: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                promise.resolve(bridge.exec(sql, params))
            } catch (e: Exception) {
                promise.reject("DB_EXEC_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dbBeginTx(promise: Promise) {
        scope.launch {
            try {
                promise.resolve(bridge.beginTx())
            } catch (e: Exception) {
                promise.reject("DB_TX_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dbExecInTx(txId: String, sql: String, params: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                promise.resolve(bridge.execInTx(txId, sql, params))
            } catch (e: Exception) {
                promise.reject("DB_TX_EXEC_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dbQueryInTx(txId: String, sql: String, params: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                promise.resolve(bridge.queryInTx(txId, sql, params))
            } catch (e: Exception) {
                promise.reject("DB_TX_QUERY_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dbCommit(txId: String, promise: Promise) {
        scope.launch {
            try {
                bridge.commit(txId)
                promise.resolve(null)
            } catch (e: Exception) {
                bridge.rollback(txId)
                promise.reject("DB_COMMIT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dbRollback(txId: String, promise: Promise) {
        scope.launch {
            try {
                bridge.rollback(txId)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ROLLBACK_ERROR", e.message, e)
            }
        }
    }

    fun onSyncComplete(state: SyncState.Complete) {
        snapshotManager.takeIfDue()
    }
}
