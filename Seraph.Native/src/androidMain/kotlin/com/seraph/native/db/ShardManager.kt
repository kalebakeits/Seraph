package com.seraph.native.db

import android.content.Context
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import co.touchlab.kermit.Logger
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.time.LocalDate
import java.time.YearMonth
import java.util.zip.GZIPOutputStream

private val log = Logger.withTag("ShardManager")

/**
 * Shards eligible months of R24 data out of the main DB into per-month SQLite files.
 *
 * Shard filename format: seraph_r24_YYYY-MM_seq_<seqMin>_<seqMax>.db.gz
 * - Date range is derivable from the YYYY-MM prefix alone.
 * - seqMin/seqMax allow locating a shard by sequence number without opening it.
 *
 * Eligibility: a month is shardable when it ended at least 2 full months ago
 * (i.e. today >= first day of (month + 3)).
 *
 * Shard schema: full current SeraphDb schema, only r24 table populated.
 * Other tables left empty — this preserves schema version for future migrations.
 */
class ShardManager(
    private val context: Context,
    private val mainDb: SeraphDb,
) {
    private val shardDir: File get() {
        // Same directory as the main DB
        val dbPath = context.filesDir.resolve("SQLite")
        dbPath.mkdirs()
        return dbPath
    }

    /** Called after sync completes on the first of the month. Shards all eligible months. */
    fun shardEligibleMonths() {
        val eligible = findEligibleMonths()
        if (eligible.isEmpty()) {
            log.i { "No months eligible for sharding" }
            return
        }
        for (month in eligible) {
            try {
                shardMonth(month)
            } catch (e: Exception) {
                log.e(e) { "Failed to shard $month — will retry next month" }
            }
        }
    }

    private fun findEligibleMonths(): List<YearMonth> {
        val today = LocalDate.now()
        // A month is eligible when today >= first of (month + 3)
        val cutoff = YearMonth.from(today).minusMonths(2)

        val alreadySharded =
            shardDir
                .listFiles()
                ?.mapNotNull { parseMonthFromFilename(it.name) }
                ?.toSet() ?: emptySet()

        // Find distinct months present in main DB r24 table
        val rows = mainDb.seraphDbQueries.getDistinctR24Months().executeAsList()
        return rows
            .mapNotNull { monthStr ->
                try {
                    YearMonth.parse(monthStr)
                } catch (_: Exception) {
                    null
                }
            }.filter { it < cutoff && it !in alreadySharded }
            .sorted()
    }

    private fun shardMonth(month: YearMonth) {
        log.i { "Sharding $month" }

        val startMs = month.atDay(1).toEpochMs()
        val endMs = month.atEndOfMonth().toEpochMs() + 86_399_999L // end of last day

        // Get seq range for filename
        val seqRange = mainDb.seraphDbQueries.getR24SeqRangeForMonth(startMs, endMs).executeAsOneOrNull()
        if (seqRange == null || seqRange.MIN == null || seqRange.MAX == null) {
            log.w { "No R24 data found for $month — skipping" }
            return
        }
        val seqMin = seqRange.MIN
        val seqMax = seqRange.MAX

        val dbFile = shardDir.resolve("seraph_r24_${month}_seq_${seqMin}_$seqMax.db")
        val gzFile = shardDir.resolve("seraph_r24_${month}_seq_${seqMin}_$seqMax.db.gz")

        if (gzFile.exists()) {
            log.i { "Shard already exists for $month — skipping" }
            return
        }

        // Open a fresh DB with the full current schema
        val shardDb = openShardDb(dbFile)

        try {
            // Bulk insert R24 rows for this month
            val rows = mainDb.seraphDbQueries.queryR24ByDateRange(startMs, endMs).executeAsList()
            log.i { "Inserting ${rows.size} rows into shard for $month" }

            shardDb.seraphDbQueries.transaction {
                for (row in rows) {
                    shardDb.seraphDbQueries.insertR24(
                        sequence = row.sequence,
                        timestamp = row.timestamp,
                        subseconds = row.subseconds,
                        heart_rate = row.heart_rate,
                        rr_intervals = row.rr_intervals,
                        skin_temp = row.skin_temp,
                        step_count = row.step_count,
                        b2 = row.b2,
                        b80 = row.b80,
                        device_id = row.device_id,
                        created_at = row.created_at,
                    )
                }
            }
        } finally {
            // Close the shard DB driver before zipping
            shardDb.seraphDbQueries.also { /* force flush */ }
        }

        // Zip the shard DB
        gzip(dbFile, gzFile)
        dbFile.delete()

        // Delete the sharded rows from main DB
        mainDb.seraphDbQueries.deleteR24InRange(startMs, endMs)
        log.i { "Shard complete: ${gzFile.name} (${gzFile.length() / 1024}KB)" }
    }

    private fun openShardDb(file: File): SeraphDb {
        val driver =
            AndroidSqliteDriver(
                FrameworkSQLiteOpenHelperFactory().create(
                    SupportSQLiteOpenHelper.Configuration
                        .builder(context.applicationContext)
                        .name(file.absolutePath)
                        .callback(
                            object : SupportSQLiteOpenHelper.Callback(SeraphDb.Schema.version.toInt()) {
                                override fun onCreate(db: SupportSQLiteDatabase) {
                                    SeraphDb.Schema.create(AndroidSqliteDriver(db))
                                }

                                override fun onUpgrade(
                                    db: SupportSQLiteDatabase,
                                    oldVersion: Int,
                                    newVersion: Int,
                                ) {
                                    SeraphDb.Schema.migrate(
                                        AndroidSqliteDriver(db),
                                        oldVersion.toLong(),
                                        newVersion.toLong(),
                                    )
                                }

                                override fun onDowngrade(
                                    db: SupportSQLiteDatabase,
                                    oldVersion: Int,
                                    newVersion: Int,
                                ) {}
                            },
                        ).build(),
                ),
            )
        return SeraphDb(driver)
    }

    private fun gzip(
        source: File,
        dest: File,
    ) {
        FileInputStream(source).use { fis ->
            GZIPOutputStream(FileOutputStream(dest)).use { gos ->
                fis.copyTo(gos)
            }
        }
    }

    // ── Shard filename parsing ────────────────────────────────────────────────

    private fun parseMonthFromFilename(name: String): YearMonth? {
        val match = SHARD_FILENAME_RE.find(name) ?: return null
        return try {
            YearMonth.parse(match.groupValues[1])
        } catch (_: Exception) {
            null
        }
    }

    fun findShardForDate(date: LocalDate): File? {
        val month = YearMonth.from(date)
        return shardDir.listFiles()?.firstOrNull { f ->
            parseMonthFromFilename(f.name) == month && f.name.endsWith(".db.gz")
        }
    }

    fun findShardForSequence(sequence: Long): File? {
        return shardDir.listFiles()?.firstOrNull { f ->
            val m = SHARD_SEQ_RE.find(f.name) ?: return@firstOrNull false
            val min = m.groupValues[1].toLongOrNull() ?: return@firstOrNull false
            val max = m.groupValues[2].toLongOrNull() ?: return@firstOrNull false
            sequence in min..max && f.name.endsWith(".db.gz")
        }
    }

    companion object {
        private val SHARD_FILENAME_RE = Regex("""seraph_r24_(\d{4}-\d{2})_seq_""")
        private val SHARD_SEQ_RE = Regex("""_seq_(\d+)_(\d+)\.db\.gz$""")
    }
}

private fun LocalDate.toEpochMs(): Long = this.atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli()
