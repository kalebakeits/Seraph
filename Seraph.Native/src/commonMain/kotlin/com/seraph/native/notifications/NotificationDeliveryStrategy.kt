package com.seraph.native.notifications

import co.touchlab.kermit.Logger
import com.seraph.native.db.SeraphDb
import kotlin.time.Clock

private val log = Logger.withTag("NotificationDeliveryStrategy")

private val SYSTEM_ONLY_TYPES = setOf("low_battery", "alarm_not_synced")

interface NotificationDeliveryStrategy {
    fun deliver(
        type: String,
        payload: String?,
        entityType: String?,
        entityId: Long?,
    )
}

abstract class BaseDeliveryStrategy(
    private val channel: NotificationChannel,
) : NotificationDeliveryStrategy {
    protected fun deliverToChannel(
        type: String,
        payload: String?,
    ) = channel.deliver(type, payload)
}

class SystemDeliveryStrategy(
    channel: NotificationChannel,
) : BaseDeliveryStrategy(channel) {
    override fun deliver(
        type: String,
        payload: String?,
        entityType: String?,
        entityId: Long?,
    ) {
        deliverToChannel(type, payload)
    }
}

@OptIn(kotlin.time.ExperimentalTime::class)
class RecordedDeliveryStrategy(
    channel: NotificationChannel,
    private val db: SeraphDb,
) : BaseDeliveryStrategy(channel) {
    override fun deliver(
        type: String,
        payload: String?,
        entityType: String?,
        entityId: Long?,
    ) {
        deliverToChannel(type, payload)
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
    }
}

class NotificationDeliveryStrategyFactory(
    private val channel: NotificationChannel,
    private val db: SeraphDb,
) {
    fun forType(type: String): NotificationDeliveryStrategy =
        if (type in SYSTEM_ONLY_TYPES) {
            SystemDeliveryStrategy(channel)
        } else {
            RecordedDeliveryStrategy(channel, db)
        }
}
