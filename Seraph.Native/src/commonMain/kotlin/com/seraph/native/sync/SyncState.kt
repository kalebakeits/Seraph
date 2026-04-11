package com.seraph.native.sync

sealed class SyncState {
    object Idle : SyncState()

    data class Syncing(
        val packetsReceived: Int,
        val latestDate: String? = null,
    ) : SyncState()

    object Aggregating : SyncState()

    data class AggregatingDate(
        val date: String,
    ) : SyncState()

    data class Complete(
        val affectedDates: List<String>,
        val closedActivityStartTs: List<Long> = emptyList(),
        val newSleepStartTs: List<Long> = emptyList(),
    ) : SyncState()

    data class Error(
        val message: String,
    ) : SyncState()
}
