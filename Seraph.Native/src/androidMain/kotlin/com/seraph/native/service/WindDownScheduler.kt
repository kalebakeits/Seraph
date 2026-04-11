package com.seraph.native.service

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import co.touchlab.kermit.Logger

private val log = Logger.withTag("WindDownScheduler")

private const val ACTION = "com.seraph.native.WIND_DOWN"
private const val EXTRA_ALARM = "alarm_unix_sec"
private const val EXTRA_SLEEP_SEC = "sleep_goal_sec"
private const val NOTIFICATION_ID = 200
private const val DEFAULT_SLEEP_GOAL_SEC = 8 * 3600
private const val WIND_DOWN_SEC = 2 * 3600 // notify 2h before bedtime

/**
 * Schedules (or cancels) a wind-down notification via AlarmManager (inexact).
 * Fires [WIND_DOWN_SEC] before bedtime (bedtime = alarm - sleepGoal).
 * Inexact — no exact alarm permission needed, ~30min delivery window is fine here.
 */
object WindDownScheduler {
    fun schedule(
        context: Context,
        alarmUnixSec: Int,
        sleepGoalSec: Int = DEFAULT_SLEEP_GOAL_SEC,
    ) {
        val fireAt = (alarmUnixSec - sleepGoalSec - WIND_DOWN_SEC).toLong() * 1000
        val nowMs = System.currentTimeMillis()

        if (fireAt <= nowMs) {
            log.d { "Wind-down time already passed — not scheduling" }
            cancel(context)
            return
        }

        val intent =
            Intent(ACTION).apply {
                putExtra(EXTRA_ALARM, alarmUnixSec)
                putExtra(EXTRA_SLEEP_SEC, sleepGoalSec)
            }
        val pending =
            PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        context
            .getSystemService(AlarmManager::class.java)
            .set(AlarmManager.RTC_WAKEUP, fireAt, pending)
        log.i { "Wind-down scheduled at ${java.util.Date(fireAt)}" }
    }

    fun cancel(context: Context) {
        val intent = Intent(ACTION)
        val pending =
            PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
            ) ?: return
        context.getSystemService(AlarmManager::class.java).cancel(pending)
        pending.cancel()
        log.d { "Wind-down notification cancelled" }
    }
}

/** Receives the AlarmManager broadcast and posts the notification. */
class WindDownReceiver : BroadcastReceiver() {
    override fun onReceive(
        context: Context,
        intent: Intent,
    ) {
        if (intent.action != ACTION) return

        val alarmSec = intent.getIntExtra(EXTRA_ALARM, 0)
        val sleepGoalSc = intent.getIntExtra(EXTRA_SLEEP_SEC, DEFAULT_SLEEP_GOAL_SEC)
        val bedtimeSec = alarmSec - sleepGoalSc
        val bedHour = (bedtimeSec % 86400) / 3600
        val bedMin = (bedtimeSec % 3600) / 60
        val ampm = if (bedHour >= 12) "PM" else "AM"
        val h = if (bedHour % 12 == 0) 12 else bedHour % 12
        val bedtime = "%d:%02d %s".format(h, bedMin, ampm)

        val nm = context.getSystemService(NotificationManager::class.java)
        nm.notify(
            NOTIFICATION_ID,
            NotificationCompat
                .Builder(context, ForegroundService.CHANNEL_ID_ALERT)
                .setContentTitle("Wind Down")
                .setContentText("Aim to be asleep by $bedtime for your alarm.")
                .setSmallIcon(
                    context.resources.getIdentifier("notification_icon", "drawable", context.packageName).takeIf { it != 0 }
                        ?: android.R.drawable.ic_dialog_info,
                ).setAutoCancel(true)
                .build(),
        )
    }
}
