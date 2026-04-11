@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.recording

import co.touchlab.kermit.Logger
import com.seraph.native.db.R24
import com.seraph.native.db.SeraphDb
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.time.Clock

private val log = Logger.withTag("RecordingManager")

// 10-byte record: 8-byte timestamp (ms) + 2-byte HR (unsigned)
private const val RECORD_BYTES = 10

enum class RecordingState { IDLE, RECORDING, PAUSED }

/**
 * Owns real-time workout recording lifecycle.
 *
 * HR samples are written to a binary temp file (not held in memory).
 * On stop(), the file is read, TRIMP/zones/hr_samples computed, and
 * a finalized activity_events row is inserted with is_manual = 2.
 *
 * Pause segments are tracked in memory as [startMs, endMs] pairs and
 * excluded from TRIMP/zone calculations. HR samples inside pauses are
 * still written to file (file is append-only) but flagged as paused
 * by writing HR = 0.
 */
class RecordingManager(
    private val cacheDir: File,
    private val db: SeraphDb,
) {
    private val _state = MutableStateFlow(RecordingState.IDLE)
    val state: StateFlow<RecordingState> = _state.asStateFlow()

    private var startTs: Long = 0L
    private var sportLabel: String = "Workout"
    private var tempFile: RandomAccessFile? = null

    // Pause tracking — list of (pauseStartMs, pauseEndMs); last entry may have endMs = 0 if still paused
    private val pauseSegments = mutableListOf<LongArray>()

    // Auto-pause: track how long HR has been in Z1
    private var z1StartMs: Long = 0L
    private var currentHr: Int = 0
    private var lastHrTs: Long = 0L

    private val autoPauseZ1Ms = 90_000L

    // ── Public API ────────────────────────────────────────────────────────────

    fun start(sportLabel: String) {
        if (_state.value != RecordingState.IDLE) {
            log.w { "start() called in state ${_state.value} — ignoring" }
            return
        }
        this.sportLabel = sportLabel
        this.startTs = Clock.System.now().toEpochMilliseconds()
        this.pauseSegments.clear()
        this.z1StartMs = 0L
        this.currentHr = 0
        this.lastHrTs = 0L

        val file = File(cacheDir, "recording_wip.bin")
        if (file.exists()) file.delete()
        tempFile = RandomAccessFile(file, "rw")

        _state.value = RecordingState.RECORDING
        log.i { "Recording started: sport=$sportLabel startTs=$startTs" }
    }

    fun onHrSample(hr: Int) {
        if (_state.value == RecordingState.IDLE) return

        val now = Clock.System.now().toEpochMilliseconds()
        currentHr = hr
        lastHrTs = now

        // Write to file: 0 HR during pause so we can skip on read
        val isRecording = _state.value == RecordingState.RECORDING
        val hrToWrite = if (isRecording) hr else 0

        try {
            val buf = ByteBuffer.allocate(RECORD_BYTES).order(ByteOrder.LITTLE_ENDIAN)
            buf.putLong(now)
            buf.putShort(hrToWrite.toShort())
            tempFile?.write(buf.array())
        } catch (e: Exception) {
            log.e(e) { "Failed to write HR sample" }
        }

        // Auto-pause logic: if Z1 for >90s, pause
        if (isRecording) {
            val profile = loadProfile()
            val fthr = profile.thresholdHr ?: ((220.0 - (profile.age ?: 30)) * 0.85)
            val z1Threshold = fthr * 0.72
            if (hr in 1..220 && hr < z1Threshold) {
                if (z1StartMs == 0L) {
                    z1StartMs = now
                } else if (now - z1StartMs > autoPauseZ1Ms) {
                    log.i { "Auto-pause: HR in Z1 for ${(now - z1StartMs) / 1000}s" }
                    pause(auto = true)
                }
            } else {
                z1StartMs = 0L
            }
        } else if (_state.value == RecordingState.PAUSED) {
            // Auto-resume: HR rose above Z1
            val profile = loadProfile()
            val fthr = profile.thresholdHr ?: ((220.0 - (profile.age ?: 30)) * 0.85)
            val z1Threshold = fthr * 0.72
            if (hr in 1..220 && hr >= z1Threshold) {
                log.i { "Auto-resume: HR back above Z1" }
                resume()
            }
        }
    }

    fun pause(auto: Boolean = false) {
        if (_state.value != RecordingState.RECORDING) return
        pauseSegments.add(longArrayOf(Clock.System.now().toEpochMilliseconds(), 0L))
        _state.value = RecordingState.PAUSED
        log.i { "Recording paused (auto=$auto)" }
    }

    fun resume() {
        if (_state.value != RecordingState.PAUSED) return
        val last = pauseSegments.lastOrNull()
        if (last != null && last[1] == 0L) last[1] = Clock.System.now().toEpochMilliseconds()
        z1StartMs = 0L
        _state.value = RecordingState.RECORDING
        log.i { "Recording resumed" }
    }

    /**
     * Stops recording, writes activity_events row, returns the new activity id and date.
     * Returns null if no data was captured.
     */
    fun stop(): StopResult? {
        val prevState = _state.value
        if (prevState == RecordingState.IDLE) return null

        // Close any open pause
        val last = pauseSegments.lastOrNull()
        if (last != null && last[1] == 0L) last[1] = Clock.System.now().toEpochMilliseconds()

        val endTs = Clock.System.now().toEpochMilliseconds()
        _state.value = RecordingState.IDLE

        val raf = tempFile ?: return null
        tempFile = null

        return try {
            raf.seek(0)
            val totalRecords = (raf.length() / RECORD_BYTES).toInt()
            if (totalRecords == 0) {
                raf.close()
                return null
            }

            val syntheticRows = mutableListOf<R24>()
            val rawBuf = ByteArray(RECORD_BYTES)
            val now = Clock.System.now().toEpochMilliseconds()
            for (i in 0 until totalRecords) {
                raf.readFully(rawBuf)
                val bb = ByteBuffer.wrap(rawBuf).order(ByteOrder.LITTLE_ENDIAN)
                val ts = bb.long
                val hr = bb.short.toInt() and 0xFFFF
                if (hr > 0) { // hr=0 = paused sample, skip
                    syntheticRows.add(
                        R24(
                            id = 0L,
                            sequence = 0L,
                            timestamp = ts,
                            subseconds = 0L,
                            heart_rate = hr.toLong(),
                            rr_intervals = null,
                            skin_temp = 0.0,
                            step_count = 0L,
                            b2 = 0L,
                            b80 = 0L,
                            device_id = "",
                            created_at = now,
                        ),
                    )
                }
            }
            raf.close()

            if (syntheticRows.isEmpty()) return null

            val durationMs =
                endTs - startTs -
                    pauseSegments.sumOf { seg ->
                        val segEnd = if (seg[1] == 0L) endTs else seg[1]
                        segEnd - seg[0]
                    }
            val durationMinutes = (durationMs / 60000L).toInt().coerceAtLeast(0)

            val date = dateFromTs(startTs)

            // Insert unfinalized — RecordedWindow.finalize() will compute and persist metrics
            db.seraphDbQueries.insertActivityEvent(
                date = date,
                start_ts = startTs,
                end_ts = endTs,
                duration_minutes = durationMinutes.toLong(),
                avg_hr = null,
                max_hr = null,
                steps = null,
                type = sportLabel,
                hr_samples = "[]",
                zone_seconds = """{"z1":0,"z2":0,"z3":0,"z4":0,"z5":0}""",
                threshold_hr = null,
                trimp = null,
                is_manual = 2L,
                hr_sum = 0.0,
                hr_count = 0L,
                created_at = now,
            )

            val activityId = db.seraphDbQueries.lastInsertRowId().executeAsOne()
            log.i {
                "Recording stopped: activityId=$activityId date=$date durationMin=$durationMinutes samples=${syntheticRows.size}"
            }

            StopResult(
                activityId = activityId,
                date = date,
                durationMs = durationMs,
                syntheticRows = syntheticRows,
            )
        } catch (e: Exception) {
            log.e(e) { "stop() failed" }
            try {
                raf.close()
            } catch (_: Exception) {
            }
            null
        }
    }

    fun discard() {
        val prevState = _state.value
        _state.value = RecordingState.IDLE
        try {
            tempFile?.close()
        } catch (_: Exception) {
        }
        tempFile = null
        pauseSegments.clear()
        File(cacheDir, "recording_wip.bin").delete()
        log.i { "Recording discarded from $prevState" }
    }

    fun getElapsedMs(): Long {
        if (startTs == 0L) return 0L
        val now = Clock.System.now().toEpochMilliseconds()
        val pausedMs =
            pauseSegments.sumOf { seg ->
                val segEnd = if (seg[1] == 0L) now else seg[1]
                segEnd - seg[0]
            }
        return (now - startTs - pausedMs).coerceAtLeast(0L)
    }

    fun getCurrentHr(): Int? =
        if (lastHrTs > 0 &&
            Clock.System.now().toEpochMilliseconds() - lastHrTs < 3000
        ) {
            currentHr
        } else {
            null
        }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun dateFromTs(ts: Long): String {
        val cal =
            java.util.Calendar
                .getInstance()
                .apply { timeInMillis = ts }
        return "%04d-%02d-%02d".format(
            cal.get(java.util.Calendar.YEAR),
            cal.get(java.util.Calendar.MONTH) + 1,
            cal.get(java.util.Calendar.DAY_OF_MONTH),
        )
    }

    private fun loadProfile(): ProfileSnapshot {
        fun param(key: String) = db.seraphDbQueries.getAppParameter(key).executeAsOneOrNull()
        val baselineMaxHr = param("baseline_max_hr")?.toDoubleOrNull()
        // baseline_rhr is stored per-day in daily_aggregations — take latest non-null value
        val today = dateFromTs(Clock.System.now().toEpochMilliseconds())
        val ago90 =
            run {
                val cal = java.util.Calendar.getInstance()
                cal.add(java.util.Calendar.DAY_OF_YEAR, -90)
                "%04d-%02d-%02d".format(
                    cal.get(java.util.Calendar.YEAR),
                    cal.get(java.util.Calendar.MONTH) + 1,
                    cal.get(java.util.Calendar.DAY_OF_MONTH),
                )
            }
        val baselineRhr =
            db.seraphDbQueries
                .queryAggregationRange(ago90, today)
                .executeAsList()
                .lastOrNull { it.baseline_rhr != null }
                ?.baseline_rhr
        return ProfileSnapshot(
            age = param("profile_age")?.toIntOrNull(),
            thresholdHr = param("profile_threshold_hr")?.toDoubleOrNull(),
            baselineRhr = baselineRhr,
            baselineMaxHr = baselineMaxHr,
        )
    }

    private data class ProfileSnapshot(
        val age: Int?,
        val thresholdHr: Double?,
        val baselineRhr: Double?,
        val baselineMaxHr: Double?,
    )

    data class StopResult(
        val activityId: Long,
        val date: String,
        val durationMs: Long,
        val syntheticRows: List<R24>,
    )
}
