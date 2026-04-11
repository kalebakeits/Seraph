package com.seraph.native.notifications

interface NotificationChannel {
    fun deliver(
        type: String,
        payload: String?,
    )
}
