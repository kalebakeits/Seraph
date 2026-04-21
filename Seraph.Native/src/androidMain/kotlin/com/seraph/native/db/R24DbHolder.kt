package com.seraph.native.db

import com.seraph.native.db.r24.R24Db

object R24DbHolder {
    lateinit var db: R24Db
        private set

    fun init(database: R24Db) {
        db = database
    }
}
