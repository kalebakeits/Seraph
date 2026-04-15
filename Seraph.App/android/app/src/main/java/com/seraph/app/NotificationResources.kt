package com.seraph.app

import android.content.Context
import android.content.res.Configuration
import java.util.Date
import java.util.Locale

object NotificationResources {

    fun build(ctx: Context, lang: String, type: String, payload: String?): Pair<String, String?> {
        val locale = Locale(lang)
        val lctx = localizedCtx(ctx, lang)
        val p = payload?.let { runCatching { org.json.JSONObject(it) }.getOrNull() }

        val startTs = p?.optLong("start_ts", -1L)?.takeIf { it > 0 }
        val durationMinutes = p?.optInt("duration_minutes", -1)?.takeIf { it >= 0 }

        val dateStr = startTs?.let { formatDate(it, locale) }
        val durationStr = durationMinutes?.let { formatDuration(lctx, it) }

        return when (type) {
            "sleep_detected" -> {
                val score = p?.optInt("score", -1)?.takeIf { it >= 0 }
                val body = listOfNotNull(
                    dateStr,
                    durationStr,
                    score?.let { lctx.getString(R.string.notifications_score, it) },
                ).joinToString(" · ").ifBlank { null }
                lctx.getString(R.string.notifications_types_sleep_detected) to body
            }
            "sleep_edited" -> {
                val score = p?.optInt("score", -1)?.takeIf { it >= 0 }
                val body = listOfNotNull(
                    dateStr,
                    durationStr,
                    score?.let { lctx.getString(R.string.notifications_score, it) },
                ).joinToString(" · ").ifBlank { null }
                lctx.getString(R.string.notifications_types_sleep_edited) to body
            }
            "workout_detected" -> {
                val avgHr = p?.optInt("avg_hr", -1)?.takeIf { it > 0 }
                val body = listOfNotNull(
                    dateStr,
                    durationStr,
                    avgHr?.let { lctx.getString(R.string.notifications_avg_hr, it) },
                ).joinToString(" · ").ifBlank { null }
                lctx.getString(R.string.notifications_types_workout_detected) to body
            }
            "workout_edited" -> {
                val avgHr = p?.optInt("avg_hr", -1)?.takeIf { it > 0 }
                val body = listOfNotNull(
                    dateStr,
                    durationStr,
                    avgHr?.let { lctx.getString(R.string.notifications_avg_hr, it) },
                ).joinToString(" · ").ifBlank { null }
                lctx.getString(R.string.notifications_types_workout_edited) to body
            }
            "workout_recorded" -> {
                val avgHr = p?.optInt("avg_hr", -1)?.takeIf { it > 0 }
                val body = listOfNotNull(
                    dateStr,
                    durationStr,
                    avgHr?.let { lctx.getString(R.string.notifications_avg_hr, it) },
                ).joinToString(" · ").ifBlank { null }
                lctx.getString(R.string.notifications_types_workout_recorded) to body
            }
            "update_available" -> {
                val version = p?.optString("version", null)
                val body = version?.let { lctx.getString(R.string.notifications_update_body, it) }
                lctx.getString(R.string.notifications_types_update_available) to body
            }
            "announcement" -> {
                lctx.getString(R.string.notifications_types_announcement) to
                    lctx.getString(R.string.notifications_announcement_body)
            }
            "low_battery" -> {
                val level = p?.optInt("level", -1)?.takeIf { it >= 0 }
                val body = level?.let { lctx.getString(R.string.notifications_low_battery_body, it) }
                lctx.getString(R.string.notifications_types_low_battery) to body
            }
            "alarm_not_synced" -> {
                lctx.getString(R.string.notifications_types_alarm_not_synced) to
                    lctx.getString(R.string.notifications_alarm_not_synced_body)
            }
            else -> type to null
        }
    }

    private fun formatDate(startMs: Long, locale: Locale): String {
        val fmt = java.text.SimpleDateFormat("EEEE, MMMM d", locale)
        return fmt.format(Date(startMs))
    }

    private fun formatDuration(ctx: Context, minutes: Int): String {
        val h = minutes / 60
        val m = minutes % 60
        return if (h > 0) ctx.getString(R.string.notifications_duration_h_m, h, m)
        else ctx.getString(R.string.notifications_duration_m, m)
    }

    private fun localizedCtx(ctx: Context, lang: String): Context {
        val locale = Locale(lang)
        val config = Configuration(ctx.resources.configuration)
        config.setLocale(locale)
        return ctx.createConfigurationContext(config)
    }

}
