package com.seraph.native.notifications

import com.seraph.native.db.SeraphDb
import com.seraph.native.service.ServiceNotificationManager

class AndroidNotificationChannel(
    private val serviceNotifications: ServiceNotificationManager,
    private val db: SeraphDb,
    private val formatSystemNotification: (lang: String, type: String, payload: String?) -> Pair<String, String?>,
    private val onInAppNotification: (type: String, payload: String?) -> Unit,
) : NotificationChannel {
    @Volatile var isForegrounded: Boolean = false

    override fun deliver(
        type: String,
        payload: String?,
    ) {
        if (isForegrounded) {
            onInAppNotification(type, payload)
        } else {
            val lang = db.seraphDbQueries.getAppParameter("language").executeAsOneOrNull() ?: "en"
            val (title, body) = formatSystemNotification(lang, type, payload)
            val deepLink = resolveDeepLink(type, payload)
            serviceNotifications.sendEventAlert(title, body, deepLink)
        }
    }

    private fun resolveDeepLink(
        type: String,
        payload: String?,
    ): String? {
        val p = payload?.let { runCatching { org.json.JSONObject(it) }.getOrNull() } ?: return null
        return when (type) {
            "sleep_detected", "sleep_edited" -> {
                val id = p.optLong("sleepId", -1L).takeIf { it > 0 } ?: return null
                "seraph://sleep/$id"
            }
            "workout_detected", "workout_edited", "workout_recorded" -> {
                val id = p.optLong("activityId", -1L).takeIf { it > 0 } ?: return null
                "seraph://workout/$id"
            }
            "alarm_not_synced" -> "seraph://wakeup"
            else -> null
        }
    }
}
