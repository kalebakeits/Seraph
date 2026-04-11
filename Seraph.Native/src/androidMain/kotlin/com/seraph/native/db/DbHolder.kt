package com.seraph.native.db

/**
 * Process-lifetime singleton DB reference.
 * Initialized by the app's Application.onCreate() before any service or UI starts.
 */
object DbHolder {
    lateinit var db: SeraphDb
        private set

    fun init(database: SeraphDb) {
        db = database
    }
}
