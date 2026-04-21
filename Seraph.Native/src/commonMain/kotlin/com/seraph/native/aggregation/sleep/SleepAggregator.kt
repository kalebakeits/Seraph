package com.seraph.native.aggregation.sleep

import com.seraph.native.aggregation.AggregationProfile
import com.seraph.native.db.AggregationDao
import com.seraph.native.db.r24.R24
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.Sleep_events

private data class ActiveSession(
    val session: Sleep_events,
    val strategy: ISleepSessionStrategy,
)

class SleepAggregator(
    private val db: SeraphDb,
    private val aggDao: AggregationDao,
    private val r24Dao: R24Dao,
) {
    fun run(
        date: String,
        rows: List<R24>,
        profile: AggregationProfile,
    ): Long? {
        if (rows.isEmpty()) return null

        val closer = SleepWindowCloser(db, aggDao, r24Dao)
        val autoOpener = AutoSessionOpener(db)
        val manualOpener = ManualSessionOpener(db)
        val autoStrategy = AutoSessionStrategy(db, closer)
        val manualStrategy = ManualSessionStrategy(db, closer)
        val napStrategy = NapSessionStrategy(db, closer)

        // Load all open sessions from DB into memory. Stays in memory — no per-row DB queries.
        val activeSessions: MutableList<ActiveSession> =
            db.seraphDbQueries
                .getOpenEditedSleep(date)
                .executeAsList()
                .map { ActiveSession(it, manualStrategy) }
                .toMutableList()

        // Nap sessions (is_manual = 2 simple, is_manual = 3 smart) both use NapSessionStrategy.
        // Loaded separately from edited (is_manual = 1) and auto (is_manual = 0) sessions.
        db.seraphDbQueries
            .getOpenNapSleep(date)
            .executeAsList()
            .forEach { activeSessions.add(ActiveSession(it, napStrategy)) }

        db.seraphDbQueries.getOpenSleep(date).executeAsOneOrNull()?.let {
            activeSessions.add(ActiveSession(it, autoStrategy))
        }

        var firstFinalizedTs: Long? = null

        for (row in rows) {
            // Try to open new sessions for this row (manual first, then auto).
            // Only attempt if that type is not already active.
            val openSessionsList = activeSessions.map { it.session }
            val hasManual = activeSessions.any { it.session.sleep_edited > 0L || it.session.is_manual > 0L }
            val hasAuto = activeSessions.any { it.session.sleep_edited == 0L && it.session.is_manual == 0L }

            if (!hasManual) {
                manualOpener.tryOpen(row, date, openSessionsList)?.let { newSession ->
                    activeSessions.add(ActiveSession(newSession, manualStrategy))
                }
            }
            if (!hasAuto) {
                autoOpener.tryOpen(row, date, activeSessions.map { it.session })?.let { newSession ->
                    activeSessions.add(ActiveSession(newSession, autoStrategy))
                }
            }

            // Dispatch row to all active sessions. Collect any that closed.
            val toRemove = mutableListOf<ActiveSession>()
            for (active in activeSessions) {
                val result = active.strategy.extend(active.session, row, date, profile)
                if (result == RowResult.CLOSED) {
                    toRemove.add(active)
                    if (firstFinalizedTs == null) firstFinalizedTs = active.session.start_ts
                }
            }
            activeSessions.removeAll(toRemove)
        }

        // Post-loop: finalize any sessions that have enough data.
        val lastTs = rows.last().timestamp
        for (active in activeSessions) {
            val ts = active.strategy.concludeIfReady(active.session, lastTs, date, profile)
            if (ts != null && firstFinalizedTs == null) firstFinalizedTs = ts
        }

        return firstFinalizedTs
    }
}
