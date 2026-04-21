package com.seraph.native.db

import androidx.sqlite.db.SupportSQLiteDatabase
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class DbBridge {
    private val transactions = ConcurrentHashMap<String, SupportSQLiteDatabase>()

    private val conn: SupportSQLiteDatabase
        get() = DbHolder.helper.writableDatabase

    fun query(sql: String, params: ReadableArray): WritableArray =
        execQuery(conn, sql, params)

    fun exec(sql: String, params: ReadableArray): Int {
        execUpdate(conn, sql, params)
        return 0
    }

    fun beginTx(): String {
        val id = UUID.randomUUID().toString()
        conn.beginTransaction()
        transactions[id] = conn
        return id
    }

    fun execInTx(txId: String, sql: String, params: ReadableArray): Int {
        val db = transactions[txId] ?: throw IllegalStateException("Unknown txId: $txId")
        execUpdate(db, sql, params)
        return 0
    }

    fun queryInTx(txId: String, sql: String, params: ReadableArray): WritableArray {
        val db = transactions[txId] ?: throw IllegalStateException("Unknown txId: $txId")
        return execQuery(db, sql, params)
    }

    fun commit(txId: String) {
        val db = transactions.remove(txId) ?: throw IllegalStateException("Unknown txId: $txId")
        try {
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun rollback(txId: String) {
        val db = transactions.remove(txId) ?: return
        db.endTransaction()
    }

    fun rollbackAll() {
        transactions.forEach { (_, db) ->
            try { db.endTransaction() } catch (_: Exception) {}
        }
        transactions.clear()
    }

    // Returns [[col0, col1, ...], ...] — Drizzle sqlite-proxy array mode
    private fun execQuery(db: SupportSQLiteDatabase, sql: String, params: ReadableArray): WritableArray {
        val args = params.toStringArgs()
        val rows = Arguments.createArray()
        db.query(sql, args).use { cursor ->
            val colCount = cursor.columnCount
            while (cursor.moveToNext()) {
                val row = Arguments.createArray()
                for (i in 0 until colCount) {
                    when (cursor.getType(i)) {
                        android.database.Cursor.FIELD_TYPE_NULL -> row.pushNull()
                        android.database.Cursor.FIELD_TYPE_INTEGER -> row.pushDouble(cursor.getLong(i).toDouble())
                        android.database.Cursor.FIELD_TYPE_FLOAT -> row.pushDouble(cursor.getDouble(i))
                        android.database.Cursor.FIELD_TYPE_STRING -> row.pushString(cursor.getString(i))
                        android.database.Cursor.FIELD_TYPE_BLOB -> row.pushString(cursor.getString(i))
                    }
                }
                rows.pushArray(row)
            }
        }
        return rows
    }

    private fun execUpdate(db: SupportSQLiteDatabase, sql: String, params: ReadableArray) {
        db.execSQL(sql, params.toBindArgs())
    }

    private fun ReadableArray.toStringArgs(): Array<String?> =
        Array(size()) { i ->
            when (getType(i)) {
                com.facebook.react.bridge.ReadableType.Null -> null
                com.facebook.react.bridge.ReadableType.Boolean -> if (getBoolean(i)) "1" else "0"
                com.facebook.react.bridge.ReadableType.Number -> {
                    val d = getDouble(i)
                    if (d == kotlin.math.floor(d) && !d.isInfinite()) d.toLong().toString() else d.toString()
                }
                else -> getString(i)
            }
        }

    private fun ReadableArray.toBindArgs(): Array<Any?> =
        Array(size()) { i ->
            when (getType(i)) {
                com.facebook.react.bridge.ReadableType.Null -> null
                com.facebook.react.bridge.ReadableType.Boolean -> if (getBoolean(i)) 1L else 0L
                com.facebook.react.bridge.ReadableType.Number -> {
                    val d = getDouble(i)
                    if (d == kotlin.math.floor(d) && !d.isInfinite()) d.toLong() else d
                }
                else -> getString(i)
            }
        }
}
