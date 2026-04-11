package com.seraph.native.aggregation

import com.seraph.native.db.SeraphDb

class IncrementalAggregationStrategy(
    private val db: SeraphDb,
) : IAggregationStrategy {
    override fun prepare(dates: List<String>) = Unit

    override fun prepareDate(date: String) = Unit

    override fun storedStrain(date: String): Double =
        db.seraphDbQueries
            .getStrainForDate(date)
            .executeAsOneOrNull()
            ?.strain ?: 0.0
}
