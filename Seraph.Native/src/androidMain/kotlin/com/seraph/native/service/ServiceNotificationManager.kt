package com.seraph.native.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.TaskStackBuilder
import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb
import com.seraph.native.notifications.NotificationWriter
import com.seraph.native.sync.Device
import com.seraph.native.sync.SyncState

private val log = Logger.withTag("ServiceNotificationManager")

private fun Context.notificationIconRes(): Int =
    resources
        .getIdentifier("notification_icon", "drawable", packageName)
        .takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info

private val CHANNEL_ALERT get() = ForegroundService.CHANNEL_ID_ALERT
private const val CHANNEL_SYNC = "seraph_sync"
private const val NOTIFICATION_ID = 1 // foreground service — mandatory, always silent
private const val SYNC_NOTIFICATION_ID = 2 // sync progress — shown only while busy, cancellable
internal const val WORKER_NOTIFICATION_ID = 3 // expedited worker foreground info
private const val ALARM_NOTIFICATION = 100
private const val LOW_BATTERY = 15f
private const val BATTERY_COOLDOWN_MS = 4L * 60 * 60 * 1000

/**
 * Owns all Android notification concerns for the foreground service.
 *
 * Sync notification: shown only while syncing or aggregating, dismissed otherwise.
 * Alert notifications: low battery, sleep/activity detected this session only.
 */
class ServiceNotificationManager(
    internal val context: Context,
) {
    private val nm = context.getSystemService(NotificationManager::class.java)
    private val prefs = context.getSharedPreferences("seraph_notifications", Context.MODE_PRIVATE)
    private var lastSyncState: SyncState = SyncState.Idle
    private var uiInForeground = false

    fun createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_SYNC, "Seraph Sync", NotificationManager.IMPORTANCE_LOW).apply {
                description =
                    "Background data sync"
            },
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_ALERT, "Seraph Alerts", NotificationManager.IMPORTANCE_HIGH).apply {
                description =
                    "Battery, sleep, and alarm alerts"
            },
        )
    }

    /** Required for startForeground — always silent, no visible content. */
    fun buildInitialNotification(): Notification =
        NotificationCompat
            .Builder(context, CHANNEL_SYNC)
            .setSmallIcon(context.notificationIconRes())
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .build()

    fun onUiForeground(inForeground: Boolean) {
        uiInForeground = inForeground
        if (inForeground) nm.cancel(SYNC_NOTIFICATION_ID) else refreshSyncNotification()
    }

    fun onConnectionState(
        ignored: Any, // Do not suppress this. Fix it why is this calls if it is a no op?
    ) {}

    fun onSyncState(state: SyncState) {
        lastSyncState = state
        refreshSyncNotification()
    }

    private fun refreshSyncNotification() {
        if (uiInForeground) {
            nm.cancel(SYNC_NOTIFICATION_ID)
            return
        }
        when (val s = lastSyncState) {
            is SyncState.Syncing ->
                nm.notify(
                    SYNC_NOTIFICATION_ID,
                    buildSyncNotification(
                        "Syncing… ${s.packetsReceived} packets" + (s.latestDate?.let { " up to $it" } ?: ""),
                    ),
                )
            is SyncState.Aggregating -> nm.notify(SYNC_NOTIFICATION_ID, buildSyncNotification("Aggregating…"))
            else -> nm.cancel(SYNC_NOTIFICATION_ID)
        }
    }

    fun cancelAll() {
        nm.cancel(NOTIFICATION_ID)
        nm.cancel(SYNC_NOTIFICATION_ID)
    }

    fun cancelAlarmNotification() = nm.cancel(ALARM_NOTIFICATION)

    fun sendAlarmNotification(writer: NotificationWriter) {
        writer.write(type = "alarm_not_synced")
    }

    suspend fun checkAndNotifyBattery(
        device: Device,
        writer: NotificationWriter,
    ) {
        if (System.currentTimeMillis() - prefs.getLong("battery_low", 0L) < BATTERY_COOLDOWN_MS) return
        try {
            val battery = device.getBattery() ?: return
            if (battery.level <= LOW_BATTERY) {
                log.i { "Low battery: ${battery.level}%" }
                prefs.edit().putLong("battery_low", System.currentTimeMillis()).apply()
                writer.write(
                    type = "low_battery",
                    payload = """{"level":${battery.level.toInt()}}""",
                )
            }
        } catch (e: Exception) {
            log.d { "Battery check skipped: ${e.message}" }
        }
    }

    /**
     * Notifies only for events produced by this aggregation pass:
     * - Sleep: new inserts only (start_ts in [newSleepStartTs]).
     * - Activity: closed activities only (start_ts in [closedActivityStartTs]).
     */
    fun checkAndNotifySleepAndActivity(
        dates: List<String>,
        closedActivityStartTs: List<Long>,
        newSleepStartTs: List<Long>,
        db: SeraphDb,
        writer: NotificationWriter,
    ) {
        if (newSleepStartTs.isNotEmpty()) {
            val sleepTsSet = newSleepStartTs.toHashSet()
            for (date in dates) {
                db.seraphDbQueries.querySleepByDate(date).executeAsList().forEach { sleep ->
                    if (sleep.start_ts in sleepTsSet) {
                        val score = sleep.sleep_score?.toInt()
                        val scoreJson = if (score != null) ""","score":$score""" else ""
                        writer.write(
                            type = "sleep_detected",
                            payload =
                                """{"screen":"SleepSessionDetail","sleepId":${sleep.id},""" +
                                    """"start_ts":${sleep.start_ts},"end_ts":${sleep.end_ts},""" +
                                    """"duration_minutes":${sleep.duration_minutes}$scoreJson}""",
                            entityType = "sleep",
                            entityId = sleep.id,
                        )
                    }
                }
            }
        }
        if (closedActivityStartTs.isNotEmpty()) {
            val actTsSet = closedActivityStartTs.toHashSet()
            for (date in dates) {
                db.seraphDbQueries.queryActivitiesByDate(date).executeAsList().forEach { activity ->
                    if (activity.start_ts in actTsSet) {
                        val sport = activity.type.trim()
                        val avgHr = activity.avg_hr?.toInt()
                        val avgHrJson = if (avgHr != null) ""","avg_hr":$avgHr""" else ""
                        writer.write(
                            type = "workout_detected",
                            payload =
                                """{"screen":"WorkoutDetail","activityId":${activity.id},""" +
                                    """"start_ts":${activity.start_ts},"end_ts":${activity.end_ts},""" +
                                    """"duration_minutes":${activity.duration_minutes},"sport":"$sport"$avgHrJson}""",
                            entityType = "activity",
                            entityId = activity.id,
                        )
                    }
                }
            }
        }
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private fun launchIntent(deepLink: String? = null): PendingIntent {
        val intent =
            (
                context.packageManager.getLaunchIntentForPackage(context.packageName)
                    ?: Intent().apply { setPackage(context.packageName) }
            ).apply {
                if (deepLink != null) putExtra("deepLink", deepLink)
            }
        return TaskStackBuilder.create(context).run {
            addNextIntentWithParentStack(intent)
            getPendingIntent(
                deepLink?.hashCode() ?: 0,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )!!
        }
    }

    private fun buildSyncNotification(text: String): Notification =
        NotificationCompat
            .Builder(context, CHANNEL_SYNC)
            .setContentTitle("Seraph")
            .setContentText(text)
            .setSmallIcon(context.notificationIconRes())
            .setContentIntent(launchIntent())
            .setOngoing(true)
            .setSilent(true)
            .build()

    /** Delivers an event alert (sleep/workout detected) when the UI is backgrounded. */
    fun sendEventAlert(
        title: String,
        body: String?,
        deepLink: String? = null,
    ) {
        sendAlert(title = title, text = body ?: "", deepLink = deepLink)
    }

    private fun sendAlert(
        title: String,
        text: String,
        id: Int = text.hashCode(),
        deepLink: String? = null,
    ) {
        nm.notify(
            id,
            NotificationCompat
                .Builder(context, CHANNEL_ALERT)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(context.notificationIconRes())
                .setContentIntent(launchIntent(deepLink))
                .setAutoCancel(true)
                .build(),
        )
    }
}
