package com.seraph.native.db

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.SecureRandom

private const val PREFS_FILE = "seraph_db_key_store"
private const val KEY_PREF = "db_passphrase_hex"
private const val KEY_LENGTH_BYTES = 32

/**
 * Manages the SQLCipher database passphrase.
 *
 * The passphrase is a random 32-byte value generated once and stored in
 * EncryptedSharedPreferences, which wraps it with a hardware-backed AES-256-GCM
 * key in the Android Keystore. The passphrase itself can be read back as plain
 * bytes — which is what SQLCipher needs — while the storage is still
 * hardware-protected against extraction from the device filesystem.
 *
 * Unlike exporting a KeyStore key directly (which returns null for hardware-backed
 * keys), this approach correctly separates key wrapping (KeyStore's job) from the
 * passphrase material (our random bytes).
 */
object DbKeyStore {
    fun getKey(context: Context): ByteArray = getOrCreateHex(context).toByteArray(Charsets.UTF_8)

    fun getKeyHex(context: Context): String = getOrCreateHex(context)

    private fun getOrCreateHex(context: Context): String {
        val prefs = buildPrefs(context)
        val existing = prefs.getString(KEY_PREF, null)
        if (existing != null) return existing

        val passphrase = ByteArray(KEY_LENGTH_BYTES).also { SecureRandom().nextBytes(it) }
        val hex = passphrase.joinToString("") { "%02x".format(it) }
        prefs.edit().putString(KEY_PREF, hex).apply()
        return hex
    }

    private fun buildPrefs(context: Context) =
        EncryptedSharedPreferences.create(
            context,
            PREFS_FILE,
            MasterKey
                .Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build(),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
}
