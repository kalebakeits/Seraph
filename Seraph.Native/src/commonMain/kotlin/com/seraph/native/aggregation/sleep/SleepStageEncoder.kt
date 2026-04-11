package com.seraph.native.aggregation.sleep

/**
 * TODO: Sleep stage classification from HR + RMSSD per 5-min bucket.
 *
 * Rules-based thresholds are not accurate enough — needs a validated model.
 * Data infrastructure is ready:
 *   - r24Dao.sampleHrBuckets(startMs, endMs, STAGE_BUCKET_MS) → avg HR per bucket
 *   - r24Dao.rrIntervalsInRange(startMs, endMs) → parse RMSSD per bucket in Kotlin
 *   - aggDao.getLatestWithBaselines() → (baselineHrv, baselineRhr) as reference
 *
 * Output format (unchanged): [{"s":<stage>,"from":<ms>,"to":<ms>},...]
 *   s=0  awake
 *   s=16 REM
 *   s=32 light
 *   s=48 deep
 *
 * Until implemented, SleepWindowCloser.buildStageSamples() returns "[]".
 */
class SleepStageEncoder {
    fun encode(
        startMs: Long,
        endMs: Long,
    ): String {
        // TODO: implement classification — inject R24Dao and AggregationDao here
        return "[]"
    }
}
