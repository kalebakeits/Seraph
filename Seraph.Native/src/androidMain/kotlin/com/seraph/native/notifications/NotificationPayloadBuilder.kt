package com.seraph.native.notifications

import com.seraph.native.db.SeraphDb

/**
 * Builds JSON payloads for in-app notifications.
 * Centralises the duplicated payload construction from WorkOrchestrator.
 */
internal object NotificationPayloadBuilder {
    fun workoutPayload(
        db: SeraphDb,
        activityId: Long,
    ): Pair<String, String>? {
        val act = db.seraphDbQueries.getActivityById(activityId).executeAsOneOrNull() ?: return null
        val sport = act.type.trim()
        val avgHr = act.avg_hr?.toInt()
        val avgHrJson = if (avgHr != null) ""","avg_hr":$avgHr""" else ""
        val payload =
            """{"screen":"WorkoutDetail","activityId":$activityId,"start_ts":${act.start_ts},"end_ts":${act.end_ts},"duration_minutes":${act.duration_minutes},"sport":"$sport"$avgHrJson}"""
        return payload to "activity"
    }

    fun sleepPayload(
        db: SeraphDb,
        sleepId: Long,
    ): Pair<String, String>? {
        val sleep = db.seraphDbQueries.getSleepById(sleepId).executeAsOneOrNull() ?: return null
        val score = sleep.sleep_score?.toInt()
        val scoreJson = if (score != null) ""","score":$score""" else ""
        val payload =
            """{"screen":"SleepSessionDetail","sleepId":$sleepId,"start_ts":${sleep.start_ts},"end_ts":${sleep.end_ts},"duration_minutes":${sleep.duration_minutes}$scoreJson}"""
        return payload to "sleep"
    }
}
