package com.seraph.native.db

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private const val TAG = "CorruptionHandler"

enum class RestorationResult { NONE, RESTORED, NO_SNAPSHOT }

class CorruptionHandler(
    private val context: Context,
) {
    fun handleIfCorrupt(
        dbPath: String,
        snapshots: SnapshotManager,
    ): RestorationResult {
        if (!isCorrupt(dbPath)) return RestorationResult.NONE

        val dbFile = File(dbPath)
        Log.e(TAG, "Corruption detected — size=${dbFile.length()}B path=$dbPath")

        val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val aside = File(dbFile.parentFile, "seraph_corrupt_$ts.db")
        try {
            dbFile.renameTo(aside)
            Log.i(TAG, "Corrupt DB preserved at ${aside.name}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to rename corrupt DB", e)
        }

        val snap =
            snapshots.latestValidSnapshot() ?: run {
                Log.w(TAG, "No valid snapshot available — starting fresh")
                return RestorationResult.NO_SNAPSHOT
            }

        return try {
            snap.copyTo(dbFile, overwrite = true)
            listOf("-wal", "-shm", "-journal").forEach { File(dbPath + it).delete() }
            Log.i(TAG, "Restored from snapshot ${snap.name}")
            RestorationResult.RESTORED
        } catch (e: Exception) {
            Log.e(TAG, "Snapshot restore failed", e)
            RestorationResult.NO_SNAPSHOT
        }
    }

    private fun isCorrupt(dbPath: String): Boolean =
        try {
            val db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY)
            db
                .rawQuery("PRAGMA integrity_check", null)
                .use { c ->
                    c.moveToFirst() && c.getString(0) != "ok"
                }.also { db.close() }
        } catch (_: Exception) {
            true
        }
}
