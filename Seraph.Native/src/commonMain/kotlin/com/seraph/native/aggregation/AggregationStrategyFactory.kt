package com.seraph.native.aggregation

import com.seraph.native.db.SeraphDb

class AggregationStrategyFactory(
    private val db: SeraphDb,
) {
    fun create(force: Boolean): IAggregationStrategy = if (force) ForceAggregationStrategy(db) else IncrementalAggregationStrategy(db)
}
