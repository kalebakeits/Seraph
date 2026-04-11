package com.seraph.native.notifications

import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb
import kotlin.time.Clock

private val log = Logger.withTag("NotificationWriter")

@OptIn(kotlin.time.ExperimentalTime::class)
class NotificationWriter(
    private val db: SeraphDb,
    private val channel: NotificationChannel,
) {
    /**
     * Persist and deliver a notification.
     *
     * If [entityType] and [entityId] are provided, any existing notification for that entity is
     * replaced — so editing an activity never stacks a second notification on top of the first.
     */
    fun write(
        type: String,
        payload: String? = null,
        entityType: String? = null,
        entityId: Long? = null,
    ) {
        try {
            db.seraphDbQueries.transaction {
                if (entityType != null && entityId != null) {
                    db.seraphDbQueries.deleteNotificationForEntity(
                        entity_type = entityType,
                        entity_id = entityId,
                    )
                }
                db.seraphDbQueries.insertNotification(
                    type = type,
                    payload = payload,
                    entity_type = entityType,
                    entity_id = entityId,
                    created_at = Clock.System.now().toEpochMilliseconds(),
                )
            }
        } catch (e: Exception) {
            log.e(e) { "Failed to persist notification type=$type entity=$entityType/$entityId" }
        }
        channel.deliver(type, payload)
    }
}
