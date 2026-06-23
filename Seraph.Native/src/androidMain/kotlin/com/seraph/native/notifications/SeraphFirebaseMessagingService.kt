package com.seraph.native.notifications

import co.touchlab.kermit.Logger
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.seraph.native.db.DbHolder
import com.seraph.native.service.ServiceNotificationManager
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

private val log = Logger.withTag("SeraphFCM")

/**
 * Receives FCM data messages and persists them as in-app notifications.
 *
 * Localization model: the message is sent to a per-env/per-locale topic (e.g.
 * "announcements_prod_fr"), so the payload already carries the final, translated
 * text. No on-device formatting or content fetch is needed.
 *
 * Expected data payload keys:
 *  - type: notification type (e.g. "update_available", "announcement")
 *  - title: localized notification title
 *  - body: localized notification body
 *  - version: (optional) app version string for update notifications
 */
@OptIn(ExperimentalTime::class)
class SeraphFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val type =
            data["type"] ?: run {
                log.w { "FCM message missing 'type' — ignoring" }
                return
            }
        log.i { "FCM received: type=$type" }

        val title = data["title"] ?: type
        val body = data["body"] ?: ""
        val db = DbHolder.db
        val payload = buildPayload(title, body, data["version"])

        try {
            db.seraphDbQueries.insertNotification(
                type = type,
                payload = payload,
                entity_type = "system",
                entity_id = null,
                created_at = Clock.System.now().toEpochMilliseconds(),
            )
        } catch (e: Exception) {
            log.e(e) { "Failed to persist FCM notification type=$type" }
        }

        val nm = ServiceNotificationManager(this)
        nm.createChannels()
        nm.sendEventAlert(title, body, deepLink = null)
    }

    override fun onNewToken(token: String) {
        log.i { "FCM token refreshed" }
        FirebaseMessaging.getInstance().subscribeToTopic("all")
        try {
            val db = DbHolder.db
            val lang = db.seraphDbQueries.getAppParameter("language").executeAsOneOrNull() ?: "en"
            subscribeToLocaleTopic(lang)
            db.seraphDbQueries.setAppParameter(
                "fcm_token",
                token,
                Clock.System.now().toEpochMilliseconds(),
            )
        } catch (e: Exception) {
            log.e(e) { "Failed to persist FCM token" }
        }
    }

    companion object {
        private val TOPIC_PREFIX = "announcements_${NotifEnv.SEGMENT}_"

        /**
         * Subscribes to the announcements topic for [lang] and unsubscribes from
         * the others, so the device only receives announcements pre-translated
         * for its current locale. Call on token refresh and on language change.
         */
        fun subscribeToLocaleTopic(lang: String) {
            val target = lang.take(2).lowercase()
            val messaging = FirebaseMessaging.getInstance()
            SUPPORTED_LANGS.forEach { code ->
                if (code == target) {
                    messaging.subscribeToTopic("$TOPIC_PREFIX$code")
                } else {
                    messaging.unsubscribeFromTopic("$TOPIC_PREFIX$code")
                }
            }
        }

        private val SUPPORTED_LANGS = listOf("en", "fr")
    }

    private fun buildPayload(
        title: String,
        body: String,
        version: String?,
    ): String {
        val escapedTitle = jsonEscape(title)
        val escapedBody = jsonEscape(body)
        val versionJson = version?.let { ""","version":"${jsonEscape(it)}"""" } ?: ""
        return """{"title":"$escapedTitle","body":"$escapedBody"$versionJson}"""
    }

    private fun jsonEscape(s: String): String =
        s
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
}
