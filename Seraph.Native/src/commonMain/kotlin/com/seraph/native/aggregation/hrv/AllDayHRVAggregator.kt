@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.aggregation.hrv

import co.touchlab.kermit.Logger
import com.seraph.core.calculators.parseRr
import com.seraph.native.aggregation.DateUtils
import com.seraph.native.db.AggregationDao
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.r24.R24
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.sqrt
import kotlin.time.Clock

private val log = Logger.withTag("WakingHRVAggregator")

private const val WINDOW_MS = 5 * 60 * 1000L
private const val SLOTS_PER_DAY = 288
private const val MIN_RR_PAIRS = 10
private const val MAX_DIFF = 200

class AllDayHRVAggregator(
    private val db: SeraphDb,
    private val aggDao: AggregationDao,
    private val r24Dao: R24Dao,
) {
    fun run(
        date: String,
        rows: List<R24>,
    ) {
        if (rows.isEmpty()) return

        val dayStartMs = DateUtils.dateToMidnightMs(date)

        val existing = loadExistingWindows(date)
        val baseline = computeBaseline(date)

        val slotsToProcess = groupBySlot(rows, dayStartMs)

        for ((slot, rrList) in slotsToProcess) {
            existing[slot] = computeSlotRmssd(rrList)
        }

        val dailyStress =
            if (baseline != null) {
                val indices =
                    existing.mapNotNull { rmssd ->
                        if (rmssd != null) stressIndex(rmssd, baseline) else null
                    }
                if (indices.isNotEmpty()) median(indices).roundToInt() else null
            } else {
                null
            }

        val windowsJson = buildJson(dayStartMs, existing)

        db.seraphDbQueries.updateHrvWindows(
            hrv_windows = windowsJson,
            daily_stress = dailyStress?.toLong(),
            baseline_waking_hrv = baseline,
            updated_at = Clock.System.now().toEpochMilliseconds(),
            date = date,
        )

        log.d { "$date: ${slotsToProcess.size} HRV slots updated" }
    }

    private fun groupBySlot(
        rows: List<R24>,
        dayStartMs: Long,
    ): Map<Int, List<String?>> {
        val bySlot = mutableMapOf<Int, MutableList<String?>>()
        for (row in rows) {
            val slot = ((row.timestamp - dayStartMs) / WINDOW_MS).toInt()
            if (slot < 0 || slot >= SLOTS_PER_DAY) continue
            bySlot.getOrPut(slot) { mutableListOf() }.add(row.rr_intervals)
        }
        return bySlot
    }

    private fun loadExistingWindows(date: String): Array<Double?> {
        val row =
            db.seraphDbQueries
                .queryAggregationRange(date, date)
                .executeAsList()
                .firstOrNull()
        val json = row?.hrv_windows ?: return Array(SLOTS_PER_DAY) { null }
        return parseJson(json)
    }

    private fun computeBaseline(date: String): Double? {
        val since = DateUtils.dateStringDaysAgo(30, date)
        val rows = db.seraphDbQueries.queryHrvWindowsRange(since, DateUtils.dateStringDaysAgo(1, date)).executeAsList()
        val allValues = mutableListOf<Double>()
        for (row in rows) {
            val windows = parseJson(row.hrv_windows)
            windows.filterNotNull().forEach { allValues.add(it) }
        }
        if (allValues.size < 10) return null
        return median(allValues)
    }

    private fun computeSlotRmssd(rrJsonList: List<String?>): Double? {
        val allRr = mutableListOf<Int>()
        for (json in rrJsonList) {
            allRr.addAll(parseRr(json))
        }
        if (allRr.size < MIN_RR_PAIRS + 1) return null
        val squaredDiffs = mutableListOf<Double>()
        for (i in 1 until allRr.size) {
            val diff = abs(allRr[i] - allRr[i - 1]).toDouble()
            if (diff <= MAX_DIFF) squaredDiffs.add(diff * diff)
        }
        if (squaredDiffs.size < MIN_RR_PAIRS) return null
        return sqrt(squaredDiffs.sum() / squaredDiffs.size)
    }

    private fun stressIndex(
        rmssd: Double,
        baseline: Double,
    ): Double {
        if (baseline <= 0) return 0.0
        return ((baseline - rmssd) / baseline).coerceIn(0.0, 1.0) * 100.0
    }

    private fun median(values: List<Double>): Double {
        val sorted = values.sorted()
        return sorted[sorted.size / 2]
    }

    private fun buildJson(
        dayStartMs: Long,
        windows: Array<Double?>,
    ): String {
        val sb = StringBuilder("[")
        for (i in windows.indices) {
            if (i > 0) sb.append(',')
            val t = dayStartMs + i * WINDOW_MS
            val v = windows[i]
            if (v != null) {
                val rounded = (v * 10).toLong()
                sb.append("{\"t\":$t,\"v\":${rounded / 10}.${rounded % 10}}")
            } else {
                sb.append("{\"t\":$t,\"v\":null}")
            }
        }
        sb.append(']')
        return sb.toString()
    }

    private fun parseJson(json: String): Array<Double?> {
        val result = Array<Double?>(SLOTS_PER_DAY) { null }
        var idx = 0
        var pos = 0
        while (pos < json.length && idx < SLOTS_PER_DAY) {
            val vPos = json.indexOf("\"v\":", pos)
            if (vPos == -1) break
            val valueStart = vPos + 4
            val valueEnd = json.indexOfAny(charArrayOf('}', ','), valueStart)
            if (valueEnd == -1) break
            val raw = json.substring(valueStart, valueEnd).trim()
            result[idx] = if (raw == "null") null else raw.toDoubleOrNull()
            idx++
            pos = valueEnd
        }
        return result
    }
}
