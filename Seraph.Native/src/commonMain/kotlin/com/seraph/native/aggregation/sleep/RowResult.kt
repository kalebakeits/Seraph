package com.seraph.native.aggregation.sleep

internal enum class RowResult {
    /** Row was within scope and accumulated into the session. */
    EXTENDED,

    /** Row caused the session to close (gap exceeded or past fixed end). */
    CLOSED,

    /** Row is outside this session's scope — not processed. */
    OUT_OF_SCOPE,
}
