package com.seraph.native.blob

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import co.touchlab.kermit.Logger
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

private val log = Logger.withTag("BlobUploader")

private const val PREFS_FILE = "seraph_blob_config"
private const val KEY_URL = "upload_url"
private const val KEY_TOKEN = "bearer_token"

object BlobUploader {
    fun upload(
        file: File,
        deviceId: String,
        packetCount: Int,
        context: Context,
    ) {
        val prefs = buildPrefs(context)
        val uploadUrl = prefs.getString(KEY_URL, null).orEmpty()
        val bearerToken = prefs.getString(KEY_TOKEN, null).orEmpty()

        if (uploadUrl.isBlank() || bearerToken.isBlank()) {
            log.w { "Blob upload skipped — upload URL or token not configured" }
            return
        }

        try {
            val conn = URL(uploadUrl).openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/octet-stream")
            conn.setRequestProperty("Authorization", "Bearer $bearerToken")
            conn.setRequestProperty("X-Device-Id", deviceId)
            conn.setRequestProperty("X-Packet-Type", "mixed")
            conn.setRequestProperty("X-Sequence-Start", "0")
            conn.setRequestProperty("X-Packet-Count", packetCount.toString())
            conn.setFixedLengthStreamingMode(file.length())

            conn.outputStream.use { out -> file.inputStream().use { it.copyTo(out) } }

            val code = conn.responseCode
            if (code in 200..299) {
                log.i { "Blob uploaded: ${file.name} ($packetCount packets) → $code" }
            } else {
                log.w { "Blob upload failed: ${file.name} → $code" }
            }
            conn.disconnect()
        } catch (e: Exception) {
            log.e(e) { "Blob upload error: ${file.name}" }
        }
    }

    fun getConfig(context: Context): Pair<String, String> {
        val prefs = buildPrefs(context)
        return Pair(
            prefs.getString(KEY_URL, null).orEmpty(),
            prefs.getString(KEY_TOKEN, null).orEmpty(),
        )
    }

    fun saveConfig(
        context: Context,
        uploadUrl: String,
        bearerToken: String,
    ) {
        buildPrefs(context)
            .edit()
            .putString(KEY_URL, uploadUrl)
            .putString(KEY_TOKEN, bearerToken)
            .apply()
    }

    private fun buildPrefs(context: Context) =
        EncryptedSharedPreferences.create(
            context,
            PREFS_FILE,
            MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
}
