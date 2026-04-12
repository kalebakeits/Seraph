package com.seraph.native.notifications

import co.touchlab.kermit.Logger
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
 * Expected data payload keys:
 *  - type: notification type (e.g. "update_available", "announcement")
 *  - version: (optional) app version string for update notifications
 *  - message: (optional) freeform text for announcements
 */
@OptIn(ExperimentalTime::class)
class SeraphFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val type = data["type"] ?: run {
            log.w { "FCM message missing 'type' — ignoring" }
            return
        }
        log.i { "FCM received: type=$type" }

        val db = DbHolder.db
        val payload = buildPayload(type, data)

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
        val lang = db.seraphDbQueries.getAppParameter("language").executeAsOneOrNull() ?: "en"
        val (title, body) = com.seraph.native.service.ForegroundService
            .systemNotificationFormatter(lang, type, payload)
        nm.sendEventAlert(title, body, deepLink = null)
    }

    override fun onNewToken(token: String) {
        log.i { "FCM token refreshed" }
        // Token stored for future server-side targeting if needed
        try {
            val db = DbHolder.db
            db.seraphDbQueries.setAppParameter(
                "fcm_token",
                token,
                Clock.System.now().toEpochMilliseconds(),
            )
        } catch (e: Exception) {
            log.e(e) { "Failed to persist FCM token" }
        }
    }

    private fun buildPayload(type: String, data: Map<String, String>): String? {
        val parts = mutableListOf<String>()
        data["version"]?.let { parts.add(""""version":"$it"""") }
        data["message"]?.let { parts.add(""""message":"$it"""") }
        data["content_id"]?.let { parts.add(""""content_id":"$it"""") }
        return if (parts.isEmpty()) null else "{${parts.joinToString(",")}}"
    }
}
