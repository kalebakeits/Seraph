package com.seraph.native.db

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import co.touchlab.kermit.Logger
import java.io.File

private val log = Logger.withTag("SnapshotManager")

private const val SNAP_A = "seraph.snap.a.db"
private const val SNAP_B = "seraph.snap.b.db"
private const val RATE_LIMIT_MS = 6 * 60 * 60 * 1_000L
private const val PARAM_LAST_SNAPSHOT = "last_snapshot_ts"

class SnapshotManager(
    private val context: Context,
) {
    private val dbDir: File get() = context.getDatabasePath("seraph.db").parentFile!!

    fun takeIfDue() {
        val now = System.currentTimeMillis()
        val last =
            DbHolder.db.seraphDbQueries
                .getAppParameter(PARAM_LAST_SNAPSHOT)
                .executeAsOneOrNull()
                ?.toLongOrNull() ?: 0L
        if (now - last < RATE_LIMIT_MS) return
        try {
            rotate()
            DbHolder.db.seraphDbQueries.setAppParameter(PARAM_LAST_SNAPSHOT, now.toString(), now)
        } catch (e: Exception) {
            log.e(e) { "Snapshot failed" }
        }
    }

    private fun rotate() {
        val snapA = File(dbDir, SNAP_A)
        val snapB = File(dbDir, SNAP_B)
        if (snapA.exists()) {
            snapA.copyTo(snapB, overwrite = true)
            snapA.delete()
        }
        copyWithBackupApi(snapA.absolutePath)
        log.i { "Snapshot written to ${snapA.name}" }
    }

    fun latestValidSnapshot(): File? {
        val snapA = File(dbDir, SNAP_A)
        val snapB = File(dbDir, SNAP_B)
        return when {
            snapA.exists() && isHealthy(snapA) -> snapA
            snapB.exists() && isHealthy(snapB) -> snapB
            else -> null
        }
    }

    private fun isHealthy(f: File): Boolean =
        try {
            val db = SQLiteDatabase.openDatabase(f.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
            db.close()
            true
        } catch (_: Exception) {
            false
        }

    private fun copyWithBackupApi(dstPath: String) {
        val conn = DbHolder.helper.writableDatabase
        conn.query("PRAGMA wal_checkpoint(TRUNCATE)").use { it.moveToFirst() }
        conn.query("VACUUM INTO '$dstPath'").use { it.moveToFirst() }
    }
}
