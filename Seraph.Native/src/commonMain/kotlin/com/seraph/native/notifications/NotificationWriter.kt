package com.seraph.native.notifications

import com.seraph.native.db.SeraphDb

class NotificationWriter(
    private val factory: NotificationDeliveryStrategyFactory,
) {
    constructor(db: SeraphDb, channel: NotificationChannel) : this(
        NotificationDeliveryStrategyFactory(channel, db),
    )

    fun write(
        type: String,
        payload: String? = null,
        entityType: String? = null,
        entityId: Long? = null,
    ) {
        factory.forType(type).deliver(type, payload, entityType, entityId)
    }
}
