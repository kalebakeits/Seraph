package com.seraph.app

import android.app.Application
import android.content.res.Configuration
import android.util.Log
import co.touchlab.kermit.Logger
import co.touchlab.kermit.LogWriter
import co.touchlab.kermit.Severity
import com.seraph.native.db.DbHolder

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.seraph.native.bridge.SeraphModule
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
                override fun createNativeModules(ctx: ReactApplicationContext) =
                    listOf(SeraphModule(ctx))
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
    DbHolder.init(ForegroundService.openDb(this))
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
    AlarmReceiver.schedule(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
