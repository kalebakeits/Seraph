package com.seraph.native.db

import android.content.Context
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import co.touchlab.kermit.Logger
import com.seraph.native.db.r24.R24
import com.seraph.native.db.r24.R24Db
import java.io.File
import java.io.FileOutputStream
import java.time.LocalDate
import java.time.YearMonth
import java.util.zip.GZIPInputStream

private val log = Logger.withTag("ShardedR24Provider")

class ShardedR24Provider(
    private val context: Context,
    private val r24Dao: R24Dao,
    private val shardManager: ShardManager,
) {
    fun queryByDate(date: String): List<R24> {
        val localDate = LocalDate.parse(date)
        return if (isHot(localDate)) {
            r24Dao.queryByDate(date)
        } else {
            queryFromShard(YearMonth.from(localDate)) { it.queryByDate(date) }
        }
    }

    fun queryFromTs(
        date: String,
        fromTs: Long,
    ): List<R24> {
        val localDate = LocalDate.parse(date)
        return if (isHot(localDate)) {
            r24Dao.queryFromTs(date, fromTs)
        } else {
            queryFromShard(YearMonth.from(localDate)) { it.queryFromTs(date, fromTs) }
        }
    }

    fun queryByDateRange(
        startMs: Long,
        endMs: Long,
    ): List<R24> {
        val startMonth = YearMonth.from(LocalDate.ofEpochDay(startMs / 86_400_000))
        val endMonth = YearMonth.from(LocalDate.ofEpochDay(endMs / 86_400_000))

        if (startMonth == endMonth) {
            val date = LocalDate.ofEpochDay(startMs / 86_400_000)
            return if (isHot(date)) {
                r24Dao.queryByDateRange(startMs, endMs)
            } else {
                queryFromShard(startMonth) { it.queryByDateRange(startMs, endMs) }
            }
        }

        val results = mutableListOf<R24>()
        var month = startMonth
        while (month <= endMonth) {
            val mStartMs = month.atDay(1).toEpochMs()
            val mEndMs = month.atEndOfMonth().toEpochMs() + 86_399_999L
            val qStart = maxOf(startMs, mStartMs)
            val qEnd = minOf(endMs, mEndMs)
            if (isHot(month.atDay(1))) {
                results += r24Dao.queryByDateRange(qStart, qEnd)
            } else {
                results += queryFromShard(month) { it.queryByDateRange(qStart, qEnd) }
            }
            month = month.plusMonths(1)
        }
        return results
    }

    private fun isHot(date: LocalDate): Boolean {
        val hotBoundary = YearMonth.from(LocalDate.now()).minusMonths(1).atDay(1)
        return !date.isBefore(hotBoundary)
    }

    private fun queryFromShard(
        month: YearMonth,
        query: (R24Dao) -> List<R24>,
    ): List<R24> {
        val gzFile = shardManager.findShardForDate(month.atDay(1))
        if (gzFile == null) {
            log.w { "No shard found for $month — returning empty" }
            return emptyList()
        }
        val tmpFile = File(context.cacheDir, "shard_${month}_tmp.db")
        return try {
            unzip(gzFile, tmpFile)
            query(R24Dao(openReadOnlyDb(tmpFile)))
        } finally {
            tmpFile.delete()
        }
    }

    private fun unzip(
        gz: File,
        dest: File,
    ) {
        GZIPInputStream(gz.inputStream()).use { gis ->
            FileOutputStream(dest).use { gis.copyTo(it) }
        }
    }

    private fun openReadOnlyDb(file: File): R24Db {
        val driver =
            AndroidSqliteDriver(
                FrameworkSQLiteOpenHelperFactory().create(
                    SupportSQLiteOpenHelper.Configuration
                        .builder(context.applicationContext)
                        .name(file.absolutePath)
                        .callback(
                            object : SupportSQLiteOpenHelper.Callback(R24Db.Schema.version.toInt()) {
                                override fun onCreate(db: SupportSQLiteDatabase) {}

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
}

private fun LocalDate.toEpochMs(): Long = this.atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli()
