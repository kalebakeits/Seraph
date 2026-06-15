package com.seraph.native.db

import android.content.Context
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import co.touchlab.kermit.Logger
import com.seraph.native.db.r24.R24Db
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.time.LocalDate
import java.time.YearMonth
import java.util.zip.GZIPOutputStream

private val log = Logger.withTag("ShardManager")

class ShardManager(
    private val context: Context,
    private val r24Db: R24Db,
) {
    private val shardDir: File
        get() = context.getDatabasePath("seraph.db").parentFile!!.also { it.mkdirs() }

    fun shardEligibleMonths() {
        val eligible = findEligibleMonths()
        if (eligible.isEmpty()) return
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
        val cutoff = YearMonth.from(today).minusMonths(2)
        val alreadySharded =
            shardDir.listFiles()?.mapNotNull { parseMonthFromFilename(it.name) }?.toSet() ?: emptySet()
        val rows = r24Db.r24DbQueries.getDistinctR24Months().executeAsList()
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
        val endMs = month.atEndOfMonth().toEpochMs() + 86_399_999L

        val seqRange = r24Db.r24DbQueries.getR24SeqRangeForMonth(startMs, endMs).executeAsOneOrNull()
        if (seqRange == null || seqRange.MIN == null || seqRange.MAX == null) {
            log.w { "No R24 data found for $month — skipping" }
            return
        }

        val dbFile = shardDir.resolve("seraph_r24_${month}_seq_${seqRange.MIN}_${seqRange.MAX}.db")
        val gzFile = shardDir.resolve("seraph_r24_${month}_seq_${seqRange.MIN}_${seqRange.MAX}.db.gz")
        if (gzFile.exists()) return

        val shardDb = openShardDb(dbFile)
        try {
            val rows = r24Db.r24DbQueries.queryR24ByDateRange(startMs, endMs).executeAsList()
            log.i { "Inserting ${rows.size} rows into shard for $month" }
            shardDb.r24DbQueries.transaction {
                for (row in rows) {
                    shardDb.r24DbQueries.insertR24(
                        sequence = row.sequence,
                        timestamp = row.timestamp,
                        subseconds = row.subseconds,
                        heart_rate = row.heart_rate,
                        rr_intervals = row.rr_intervals,
                        skin_temp = row.skin_temp,
                        step_count = row.step_count,
                        b2 = row.b2,
                        b80 = row.b80,
                        created_at = row.created_at,
                    )
                }
            }
        } finally {
            // close shard before zipping
        }

        gzip(dbFile, gzFile)
        dbFile.delete()
        r24Db.r24DbQueries.deleteR24InRange(startMs, endMs)
        log.i { "Shard complete: ${gzFile.name} (${gzFile.length() / 1024}KB)" }
    }

    private fun openShardDb(file: File): R24Db {
        val driver =
            AndroidSqliteDriver(
                FrameworkSQLiteOpenHelperFactory().create(
                    SupportSQLiteOpenHelper.Configuration
                        .builder(context.applicationContext)
                        .name(file.absolutePath)
                        .callback(
                            object : SupportSQLiteOpenHelper.Callback(R24Db.Schema.version.toInt()) {
                                override fun onCreate(db: SupportSQLiteDatabase) {
                                    R24Db.Schema.create(AndroidSqliteDriver(db))
                                }

                                override fun onUpgrade(
                                    db: SupportSQLiteDatabase,
                                    oldVersion: Int,
                                    newVersion: Int,
                                ) {
                                    R24Db.Schema.migrate(AndroidSqliteDriver(db), oldVersion.toLong(), newVersion.toLong())
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
        return R24Db(driver)
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

    fun findShardForSequence(sequence: Long): File? =
        shardDir.listFiles()?.firstOrNull { f ->
            val m = SHARD_SEQ_RE.find(f.name) ?: return@firstOrNull false
            val min = m.groupValues[1].toLongOrNull() ?: return@firstOrNull false
            val max = m.groupValues[2].toLongOrNull() ?: return@firstOrNull false
            sequence in min..max && f.name.endsWith(".db.gz")
        }

    companion object {
        private val SHARD_FILENAME_RE = Regex("""seraph_r24_(\d{4}-\d{2})_seq_""")
        private val SHARD_SEQ_RE = Regex("""_seq_(\d+)_(\d+)\.db\.gz$""")
    }
}

private fun LocalDate.toEpochMs(): Long = this.atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli()
