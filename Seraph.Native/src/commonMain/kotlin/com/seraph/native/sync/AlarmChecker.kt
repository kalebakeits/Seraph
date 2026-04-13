@file:OptIn(kotlin.time.ExperimentalTime::class)

package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive
import kotlin.time.Clock

/**
 * Platform-specific: given alarm hour/minute in local time, return the next
 * occurrence as a Unix-seconds timestamp.
 */
expect fun calculateNextOccurrencePlatform(
    hour: Int,
    minute: Int,
): Int

/** Platform-specific: day of week (0=Sun .. 6=Sat) for a Unix timestamp in local timezone. */
expect fun dayOfWeekForUnixPlatform(unixSec: Int): Int

private val log = Logger.withTag("AlarmChecker")

/**
 * Reads alarm preferences from app_parameters and decides whether the device
 * alarm is stale. Returns an [AlarmAction] telling the caller what to do.
 */
class AlarmChecker(
    private val db: SeraphDb,
) {
    sealed class AlarmAction {
        /** Everything is fine — alarm already set or not configured. */
        object None : AlarmAction()

        /** The alarm should be set to this Unix-seconds value. */
        data class SetAlarm(
            val unixSec: Int,
        ) : AlarmAction()

        /** Device unreachable — notify user to open app so alarm can sync. */
        data class NotifyUser(
            val alarmUnixSec: Int,
        ) : AlarmAction()
    }

    /**
     * Check if the next alarm needs syncing.
     *
     * @param deviceAlarmSec  The alarm currently set on the device (0 or null = none).
     * @param isConnected     Whether we currently have a BLE connection.
     */
    fun check(
        deviceAlarmSec: Int?,
        isConnected: Boolean,
    ): AlarmAction {
        // A nap has taken ownership of the device alarm — do not overwrite it.
        if (!getPref("nap_mode").isNullOrEmpty()) return AlarmAction.None

        val nextAlarm = getNextAlarmSeconds() ?: return AlarmAction.None

        // Device already has the correct alarm set (within 60s tolerance for clock drift)
        if (deviceAlarmSec != null &&
            deviceAlarmSec != 0 &&
            kotlin.math.abs(deviceAlarmSec - nextAlarm) < 60
        ) {
            return AlarmAction.None
        }

        // If connected we can set it directly
        if (isConnected) {
            return AlarmAction.SetAlarm(nextAlarm)
        }

        // Not connected — only notify if we're within the wind-down window
        val nowSec = (Clock.System.now().toEpochMilliseconds() / 1000).toInt()
        val sleepGoalSec = getPref("profile_sleep_goal_minutes")?.toIntOrNull()?.times(60) ?: (8 * 3600)
        val windDownSec = 2 * 3600 // 2 hours before bed
        val bedtimeSec = nextAlarm - sleepGoalSec
        val windowStart = bedtimeSec - windDownSec

        return if (nowSec in windowStart until nextAlarm) {
            AlarmAction.NotifyUser(nextAlarm)
        } else {
            AlarmAction.None
        }
    }

    // ── DB reads ─────────────────────────────────────────────────────────────

    private fun getNextAlarmSeconds(): Int? {
        val mode = getPref("alarm_mode") ?: return null
        if (mode == "disabled") return null

        val timeStr = getPref("alarm_time") ?: return null // "HH:MM"
        val parts = timeStr.split(":")
        if (parts.size != 2) return null

        val hour = parts[0].toIntOrNull() ?: return null
        val minute = parts[1].toIntOrNull() ?: return null

        val nextOccurrence = calculateNextOccurrence(hour, minute)

        if (mode == "single") return nextOccurrence

        // Schedule mode — walk forward up to 7 days to find the next enabled day
        val scheduleJson = getPref("alarm_schedule") ?: return nextOccurrence
        try {
            val arr = Json.parseToJsonElement(scheduleJson).jsonArray
            val secondsPerDay = 86400
            var candidate = nextOccurrence
            repeat(7) {
                val dayOfWeek = dayOfWeekForUnix(candidate) // 0=Sun .. 6=Sat
                val enabled =
                    arr
                        .getOrNull(dayOfWeek)
                        ?.jsonPrimitive
                        ?.content
                        ?.toIntOrNull() ?: 0
                if (enabled == 1) return candidate
                candidate += secondsPerDay
            }
            return null // no enabled day in the next 7 days
        } catch (e: Exception) {
            log.w { "Failed to parse alarm schedule: $e" }
            return nextOccurrence
        }
    }

    private fun getPref(key: String): String? =
        try {
            db.seraphDbQueries.getAppParameter(key).executeAsOneOrNull()
        } catch (e: Exception) {
            log.w { "Failed to read app_parameters.$key: $e" }
            null
        }

    companion object {
        /**
         * Given an alarm hour/minute in local time, find the next occurrence as Unix seconds.
         * Uses expect/actual [calculateNextOccurrencePlatform] so timezone handling is correct.
         */
        fun calculateNextOccurrence(
            hour: Int,
            minute: Int,
        ): Int = calculateNextOccurrencePlatform(hour, minute)

        /** Day of week for a Unix timestamp (local timezone): 0=Sun, 1=Mon, … 6=Sat */
        fun dayOfWeekForUnix(unixSec: Int): Int = dayOfWeekForUnixPlatform(unixSec)
    }
}
