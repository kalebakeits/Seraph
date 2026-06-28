package com.seraph.native.sync

import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.AggregationRunner
import com.seraph.native.db.SeraphDb
import com.seraph.native.notifications.NotificationPayloadBuilder
import com.seraph.native.notifications.NotificationWriter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

private val log = Logger.withTag("AggregationCoordinator")

/**
 * Runs re-aggregation tasks and reports state via [state].
 */
class AggregationCoordinator(
    private val orchestrator: WorkOrchestrator,
    private val aggregationRunner: AggregationRunner,
    private val db: SeraphDb,
    private val notificationWriter: NotificationWriter? = null,
) {
    private val _state = MutableStateFlow<SyncState>(SyncState.Idle)
    val state: StateFlow<SyncState> = _state.asStateFlow()

    suspend fun recalcActivity(activityId: Long) {
        val token = orchestrator.acquireToken()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) { aggregationRunner.recalcActivity(activityId) }
            notificationWriter?.let { nw ->
                NotificationPayloadBuilder.workoutPayload(db, activityId)?.let { (payload, entityType) ->
                    nw.write(type = "workout_edited", payload = payload, entityType = entityType, entityId = activityId)
                }
            }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            token.release()
        }
    }

    suspend fun recalcSleep(sleepId: Long) {
        val token = orchestrator.acquireToken()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) { aggregationRunner.recalcSleep(sleepId) }
            notificationWriter?.let { nw ->
                NotificationPayloadBuilder.sleepPayload(db, sleepId)?.let { (payload, entityType) ->
                    nw.write(type = "sleep_edited", payload = payload, entityType = entityType, entityId = sleepId)
                }
            }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            token.release()
        }
    }

    suspend fun refreshDailyLoad(date: String) {
        val token = orchestrator.acquireToken()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) { aggregationRunner.refreshDailyLoad(date) }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            token.release()
        }
    }

    suspend fun recalculateCurrentSleepNeed() {
        val token = orchestrator.acquireToken()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) { aggregationRunner.recalculateCurrentSleepNeed() }
            _state.value = SyncState.Complete(emptyList())
        } finally {
            token.release()
        }
    }

    suspend fun reaggregate(dates: List<String>) {
        if (dates.isEmpty()) return
        val token = orchestrator.acquireToken()
        try {
            _state.value = SyncState.Aggregating
            withContext(Dispatchers.Default) {
                for (date in dates) {
                    db.seraphDbQueries.deleteActivityNotificationsForDate(date)
                    db.seraphDbQueries.deleteSleepNotificationsForDate(date)
                }
                aggregationRunner.run(dates, force = true) { date ->
                    _state.value = SyncState.AggregatingDate(date)
                }
            }
            _state.value = SyncState.Complete(dates)
        } finally {
            token.release()
        }
    }
}
