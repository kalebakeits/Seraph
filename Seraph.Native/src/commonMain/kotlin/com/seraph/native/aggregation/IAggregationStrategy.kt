package com.seraph.native.aggregation

interface IAggregationStrategy {
    /** Called once before the per-date loop with the full sorted date range. */
    fun prepare(dates: List<String>)

    /** Called per-date to perform any date-level setup before aggregators run. */
    fun prepareDate(date: String)

    /** Returns the stored strain for a date, used as the base for incremental accumulation. */
    fun storedStrain(date: String): Double
}
