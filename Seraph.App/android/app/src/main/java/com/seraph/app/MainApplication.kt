package com.seraph.app

import android.app.Application
import android.content.res.Configuration
import android.util.Log
import co.touchlab.kermit.Logger
import io.sentry.Sentry
import io.sentry.SentryLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import co.touchlab.kermit.LogWriter
import co.touchlab.kermit.Severity
import com.seraph.native.db.DbHolder
import com.seraph.native.db.R24DbHolder

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.seraph.native.bridge.DbModule
import com.seraph.native.bridge.DeviceModule
import com.seraph.native.bridge.DevToolsModule
import com.seraph.native.bridge.NapModule
import com.seraph.native.bridge.NotificationModule
import com.seraph.native.bridge.RecordingModule
import com.seraph.native.bridge.SeraphModule
import com.seraph.native.bridge.SyncModule
import com.seraph.native.service.AlarmReceiver
import com.seraph.native.service.ForegroundService
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {


  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(object : ReactPackage {
                override fun createNativeModules(ctx: ReactApplicationContext): List<com.facebook.react.bridge.NativeModule> {
                    val dbModule = DbModule(ctx)
                    val seraphModule = SeraphModule(ctx, dbModule)
                    return listOf(
                        dbModule,
                        seraphModule,
                        SyncModule(ctx) { seraphModule.getService() },
                        DeviceModule(ctx) { seraphModule.getService() },
                        RecordingModule(ctx) { seraphModule.getService() },
                        NapModule(ctx) { seraphModule.getService() },
                        NotificationModule(ctx),
                        DevToolsModule(ctx) { seraphModule.getService() },
                    )
                }
                override fun createViewManagers(ctx: ReactApplicationContext) =
                    emptyList<ViewManager<*, *>>()
              })
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    Logger.setLogWriters(object : LogWriter() {
      override fun log(severity: Severity, message: String, tag: String, throwable: Throwable?) {
        val priority = when (severity) {
          Severity.Verbose -> Log.VERBOSE
          Severity.Debug   -> Log.DEBUG
          Severity.Info    -> Log.INFO
          Severity.Warn    -> Log.WARN
          Severity.Error   -> Log.ERROR
          Severity.Assert  -> Log.ASSERT
        }
        Log.println(priority, "Seraph", "[$tag] $message")
        throwable?.let { Log.println(priority, "Seraph", Log.getStackTraceString(it)) }
      }
    })
    ForegroundService.systemNotificationFormatter = { lang, type, payload ->
      NotificationResources.build(this, lang, type, payload)
    }
    DbHolder.initFromTriple(ForegroundService.openDb(this))
    R24DbHolder.init(ForegroundService.openR24Db(this))
    when (DbHolder.restorationResult) {
      com.seraph.native.db.RestorationResult.RESTORED -> {
        Sentry.captureMessage("seraph.db corruption detected — restored from snapshot", SentryLevel.WARNING)
        schedulePostRestoreReagg()
      }
      com.seraph.native.db.RestorationResult.NO_SNAPSHOT ->
        Sentry.captureMessage("seraph.db corruption detected — no snapshot available, started fresh", SentryLevel.ERROR)
      com.seraph.native.db.RestorationResult.NONE -> Unit
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
    AlarmReceiver.schedule(this)
  }

  private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  
  // TODO: Extract this into an interface and inject it instead
  private fun schedulePostRestoreReagg() {
    val db = DbHolder.db
    val r24Db = R24DbHolder.db
    val maxAggTs = db.seraphDbQueries.getMaxLastAggTs().executeAsOneOrNull()?.max_ts ?: 0L
    val datesToReagg = r24Db.r24DbQueries.getDistinctDatesNewerThan(maxAggTs).executeAsList()
    if (datesToReagg.isEmpty()) return
    Log.i("MainApplication", "Post-restore: re-aggregating ${datesToReagg.size} date(s): $datesToReagg")
    appScope.launch {
      try {
        com.seraph.native.aggregation.AggregationRunner.build(db, r24Db).run(datesToReagg)
      } catch (e: Exception) {
        Log.e("MainApplication", "Post-restore re-aggregation failed", e)
        Sentry.captureException(e)
      }
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
