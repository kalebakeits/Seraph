package com.seraph.native.blob

import kotlinx.coroutines.CoroutineScope
import java.io.File

@Suppress("UnusedParameter")
class BlobWriter(
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
