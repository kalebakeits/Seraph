package com.seraph.native.db

import android.content.Context

object DbKeyExport {
    fun getHex(context: Context): String = DbKeyStore.getKeyHex(context)
}
