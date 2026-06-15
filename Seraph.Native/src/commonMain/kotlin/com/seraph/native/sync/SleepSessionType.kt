package com.seraph.native.sync

/**
 * Sleep session types used in the is_manual column of sleep_events table.
 *
 * These constants define the different modes of sleep tracking:
 * - AUTO: Automatically detected sleep sessions
 * - MANUAL: User-initiated manual sleep tracking
 * - NAP_SIMPLE: Nap with alarm at specific time (not dependent on sleep detection)
 * - NAP_SMART: Nap with alarm after N minutes of detected sleep
 */
object SleepSessionType {
    const val AUTO = 0L
    const val MANUAL = 1L
    const val NAP_SIMPLE = 2L
    const val NAP_SMART = 3L
}
