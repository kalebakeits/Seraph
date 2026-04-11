package com.seraph.native.service

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import co.touchlab.kermit.Logger

private val log = Logger.withTag("AlarmReceiver")
private const val SYNC_INTERVAL_MS = 15 * 60 * 1000L // 15 minutes

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(
        context: Context,
        intent: Intent,
    ) {
        // Reschedule next alarm first
        scheduleNext(context)

        val prefs = context.getSharedPreferences("seraph_service", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("device_id", null)
        if (deviceId == null) {
            log.w { "No device configured — skipping background sync" }
            return
        }
        log.i { "Alarm fired — starting background sync for $deviceId" }
        context.startForegroundService(
            Intent(context, ForegroundService::class.java)
                .putExtra(ForegroundService.EXTRA_DEVICE_ID, deviceId),
        )
    }

    companion object {
        private const val REQUEST_CODE = 42

        private fun pendingIntent(context: Context) =
            PendingIntent.getBroadcast(
                context,
                REQUEST_CODE,
                Intent(context, AlarmReceiver::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        fun schedule(context: Context) = scheduleNext(context)

        private fun scheduleNext(context: Context) {
            val am = context.getSystemService(AlarmManager::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                // Fall back to inexact — won't grant FG start exemption but best we can do
                log.w { "Exact alarm permission not granted — using inexact" }
                am.setInexactRepeating(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + SYNC_INTERVAL_MS,
                    SYNC_INTERVAL_MS,
                    pendingIntent(context),
                )
                return
            }
            am.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + SYNC_INTERVAL_MS,
                pendingIntent(context),
            )
            log.i { "Next background sync alarm scheduled in ${SYNC_INTERVAL_MS / 60000}min" }
        }

        fun cancel(context: Context) {
            context
                .getSystemService(AlarmManager::class.java)
                .cancel(pendingIntent(context))
            log.i { "Background sync alarm cancelled" }
        }
    }
}
