package com.seraph.native.bridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.seraph.native.db.DbHolder
import com.seraph.native.notifications.SeraphFirebaseMessagingService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class NotificationModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "NotificationModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @ReactMethod
    fun getUnreadNotificationCount(promise: Promise) {
        scope.launch {
            try {
                val count =
                    DbHolder.db.seraphDbQueries
                        .getUnreadNotificationCount()
                        .executeAsOne()
                promise.resolve(count.toInt())
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun markNotificationRead(
        id: Double,
        promise: Promise,
    ) {
        scope.launch {
            try {
                DbHolder.db.seraphDbQueries.markNotificationRead(id.toLong())
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun markAllNotificationsRead(promise: Promise) {
        scope.launch {
            try {
                DbHolder.db.seraphDbQueries.markAllNotificationsRead()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun subscribeToLocaleTopic(
        lang: String,
        promise: Promise,
    ) {
        scope.launch {
            try {
                SeraphFirebaseMessagingService.subscribeToLocaleTopic(lang)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("FCM_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
