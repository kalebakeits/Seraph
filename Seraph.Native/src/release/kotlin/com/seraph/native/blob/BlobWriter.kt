package com.seraph.native.blob

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import java.io.File

@Suppress("UnusedParameter")
class BlobWriter(
    context: Context,
    cacheDir: File,
    deviceId: String,
    scope: CoroutineScope,
) {
    val isAvailable: Boolean = false

    fun write(
        type: String,
        raw: ByteArray,
    ) = Unit
}
