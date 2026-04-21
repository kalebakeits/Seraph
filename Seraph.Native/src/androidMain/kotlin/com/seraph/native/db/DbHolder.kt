package com.seraph.native.db

import androidx.sqlite.db.SupportSQLiteOpenHelper

object DbHolder {
    lateinit var db: SeraphDb
        private set

    lateinit var helper: SupportSQLiteOpenHelper
        private set

    var restorationResult: RestorationResult = RestorationResult.NONE
        private set

    fun init(database: SeraphDb, openHelper: SupportSQLiteOpenHelper, result: RestorationResult = RestorationResult.NONE) {
        db = database
        helper = openHelper
        restorationResult = result
    }

    fun initFromTriple(triple: Triple<SeraphDb, SupportSQLiteOpenHelper, RestorationResult>) =
        init(triple.first, triple.second, triple.third)
}
