package com.seraph.native.blob

import co.touchlab.kermit.Logger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private val log = Logger.withTag("BlobWriter")

private const val MAX_BYTES = 5 * 1024 * 1024 // 5 MB

class BlobWriter(
    private val context: android.content.Context,
    private val cacheDir: File,
    private val deviceId: String,
    private val scope: CoroutineScope,
) {
    val isAvailable: Boolean = true
    private var file: File = newFile()
    private var stream: FileOutputStream = FileOutputStream(file, true)
    private var count: Int = 0
    private val lock = ReentrantLock()

    fun write(
        type: String,
        raw: ByteArray,
    ) {
        lock.withLock {
            stream.write(raw)
            count++
            if (file.length() >= MAX_BYTES) roll()
        }
    }

    private fun roll() {
        lock.withLock {
            stream.flush()
            stream.close()
            val rolled = File(cacheDir, "seraph_blob_${System.currentTimeMillis()}.bin")
            file.renameTo(rolled)
            uploadAndDelete(rolled, count)
            file = newFile()
            stream = FileOutputStream(file, true)
            count = 0
        }
    }

    private fun uploadAndDelete(
        f: File,
        c: Int,
    ) {
        scope.launch(Dispatchers.IO) {
            BlobUploader.upload(f, deviceId, c, context)
            f.delete()
        }
    }

    private fun newFile() = File(cacheDir, "seraph_blob.bin")
}
