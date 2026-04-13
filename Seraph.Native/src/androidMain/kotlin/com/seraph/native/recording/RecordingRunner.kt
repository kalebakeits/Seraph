package com.seraph.native.recording

import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.AggregationRunner
import com.seraph.native.db.SeraphDb
import com.seraph.native.notifications.NotificationPayloadBuilder
import com.seraph.native.notifications.NotificationWriter
import com.seraph.native.sync.WorkOrchestrator

private val log = Logger.withTag("RecordingRunner")

/**
 * Wraps [RecordingManager] with [WorkOrchestrator] token acquisition so the service
 * stays alive for the duration of a workout recording.
 */
class RecordingRunner(
    private val orchestrator: WorkOrchestrator,
    private val recordingManager: RecordingManager,
    private val aggregationRunner: AggregationRunner,
    private val db: SeraphDb,
    private val notificationWriter: NotificationWriter? = null,
) {
    private var token: WorkOrchestrator.Token? = null

    fun start(sportLabel: String) {
        val t = orchestrator.acquireToken()
        try {
            recordingManager.start(sportLabel)
            token = t
        } catch (e: Exception) {
            t.release()
            throw e
        }
    }

    suspend fun stop(): RecordingManager.StopResult? {
        return try {
            val result = recordingManager.stop() ?: return null
            aggregationRunner.finalizeRecordedActivity(result.activityId, result.syntheticRows)
            notificationWriter?.let { nw ->
                NotificationPayloadBuilder.workoutPayload(db, result.activityId)?.let { (payload, entityType) ->
                    nw.write(type = "workout_recorded", payload = payload, entityType = entityType, entityId = result.activityId)
                }
            }
            result
        } finally {
            token?.release()
            token = null
        }
    }

    fun discard() {
        try {
            recordingManager.discard()
        } finally {
            token?.release()
            token = null
        }
    }
}
