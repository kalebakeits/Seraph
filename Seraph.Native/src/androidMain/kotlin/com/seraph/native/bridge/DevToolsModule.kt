package com.seraph.native.bridge

import android.content.Intent
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.seraph.native.db.DbKeyExport
import com.seraph.native.service.ForegroundService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DevToolsModule(
    reactContext: ReactApplicationContext,
    private val serviceProvider: () -> ForegroundService?,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "DevToolsModule"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @ReactMethod
    fun getDbKey(promise: Promise) {
        try {
            promise.resolve(DbKeyExport.getHex(reactApplicationContext))
        } catch (e: Exception) {
            promise.reject("FORBIDDEN", e.message)
        }
    }

    @ReactMethod
    fun exportDb(promise: Promise) {
        scope.launch {
            try {
                val dbDir = reactApplicationContext.getDatabasePath("seraph.db").parentFile!!
                val downloads =
                    android.os.Environment.getExternalStoragePublicDirectory(
                        android.os.Environment.DIRECTORY_DOWNLOADS,
                    )
                val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
                val exportDir = File(downloads, "seraph_$ts")
                exportDir.mkdirs()

                dbDir.listFiles()?.forEach { file ->
                    if (!file.name.endsWith("-wal") &&
                        !file.name.endsWith("-shm") &&
                        !file.name.endsWith("-journal")
                    ) {
                        file.copyTo(File(exportDir, file.name), overwrite = true)
                    }
                }

                promise.resolve(exportDir.absolutePath)
            } catch (e: Exception) {
                promise.reject("EXPORT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun importDb(
        srcPaths: ReadableArray,
        destNames: ReadableArray,
        promise: Promise,
    ) {
        scope.launch {
            try {
                serviceProvider()?.syncRunner?.abortSync()
                val dbDir = reactApplicationContext.getDatabasePath("seraph.db").parentFile!!
                dbDir.mkdirs()

                val errors = mutableListOf<String>()
                for (i in 0 until srcPaths.size()) {
                    val srcPath = srcPaths.getString(i) ?: continue
                    val destName = destNames.getString(i) ?: File(srcPath).name
                    val src = File(srcPath)
                    if (!src.exists()) {
                        errors.add("Not found: ${src.name}")
                        continue
                    }
                    val dst = File(dbDir, destName)
                    listOf("-wal", "-shm", "-journal").forEach { File(dst.absolutePath + it).delete() }
                    dst.delete()
                    src.copyTo(dst, overwrite = true)
                }

                if (errors.isNotEmpty()) {
                    promise.reject("IMPORT_ERROR", errors.joinToString(", "))
                } else {
                    promise.resolve(null)
                }
            } catch (e: Exception) {
                promise.reject("IMPORT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun restartApp(promise: Promise) {
        scope.launch(Dispatchers.Main) {
            try {
                reactApplicationContext.stopService(Intent(reactApplicationContext, ForegroundService::class.java))
                promise.resolve(null)
            } catch (_: Exception) {
                promise.resolve(null)
            } finally {
                Handler(Looper.getMainLooper()).postDelayed({
                    android.os.Process.killProcess(android.os.Process.myPid())
                }, 300)
            }
        }
    }

    @ReactMethod
    fun isBlobUploadAvailable(promise: Promise) {
        promise.resolve(serviceProvider()?.isBlobUploadAvailable ?: false)
    }

    @ReactMethod
    fun getBlobUploadConfig(promise: Promise) {
        try {
            val clazz = Class.forName("com.seraph.native.blob.BlobUploader")
            val method = clazz.getMethod("getConfig", android.content.Context::class.java)

            @Suppress("UNCHECKED_CAST")
            val pair = method.invoke(clazz.kotlin.objectInstance, reactApplicationContext) as Pair<String, String>
            promise.resolve(
                Arguments.createMap().apply {
                    putString("uploadUrl", pair.first)
                    putString("bearerToken", pair.second)
                },
            )
        } catch (e: ClassNotFoundException) {
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("BLOB_CONFIG_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setBlobUploadConfig(
        uploadUrl: String,
        bearerToken: String,
        promise: Promise,
    ) {
        try {
            val clazz = Class.forName("com.seraph.native.blob.BlobUploader")
            val method = clazz.getMethod("saveConfig", android.content.Context::class.java, String::class.java, String::class.java)
            method.invoke(clazz.kotlin.objectInstance, reactApplicationContext, uploadUrl, bearerToken)
            promise.resolve(null)
        } catch (e: ClassNotFoundException) {
            promise.reject("UNAVAILABLE", "Blob upload not available in this build")
        } catch (e: Exception) {
            promise.reject("BLOB_CONFIG_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
