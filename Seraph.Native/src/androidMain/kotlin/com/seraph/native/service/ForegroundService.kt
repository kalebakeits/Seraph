package com.seraph.native.service

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import androidx.sqlite.db.SupportSQLiteOpenHelper
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import co.touchlab.kermit.Logger
import com.seraph.native.aggregation.AggregationRunner
import com.seraph.native.ble.ConnectionManager
import com.seraph.native.blob.BlobWriter
import com.seraph.native.db.DbHolder
import com.seraph.native.db.R24Dao
import com.seraph.native.db.SeraphDb
import com.seraph.native.db.ShardManager
import com.seraph.native.notifications.AndroidNotificationChannel
import com.seraph.native.notifications.NotificationWriter
import com.seraph.native.parsers.PacketRouter
import com.seraph.native.recording.RecordingManager
import com.seraph.native.recording.RecordingRunner
import com.seraph.native.recording.RecordingState
import com.seraph.native.sync.AggregationCoordinator
import com.seraph.native.sync.AlarmChecker
import com.seraph.native.sync.ConnectionState
import com.seraph.native.sync.Device
import com.seraph.native.sync.NapRunner
import com.seraph.native.sync.SyncLoopRunner
import com.seraph.native.sync.SyncRunner
import com.seraph.native.sync.SyncState
import com.seraph.native.sync.WorkOrchestrator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import java.io.File

private val log = Logger.withTag("ForegroundService")

class ForegroundService : Service() {
    companion object {
        const val EXTRA_DEVICE_ID = "device_id"
        const val CHANNEL_ID_ALERT = "seraph_alert"
        const val NOTIFICATION_ID = 1

        var systemNotificationFormatter: ((lang: String, type: String, payload: String?) -> Pair<String, String?>) =
            { _, type, _ -> type to null }

        fun dbPath(context: android.content.Context): String = context.getDatabasePath("seraph.db").absolutePath

        fun openDb(context: android.content.Context): SeraphDb {
            val file = File(dbPath(context))
            file.parentFile?.mkdirs()
            val driver =
                AndroidSqliteDriver(
                    androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory().create(
                        SupportSQLiteOpenHelper.Configuration
                            .builder(context.applicationContext)
                            .name("seraph.db")
                            .callback(
                                object : SupportSQLiteOpenHelper.Callback(SeraphDb.Schema.version.toInt()) {
                                    override fun onCreate(db: androidx.sqlite.db.SupportSQLiteDatabase) {
                                        SeraphDb.Schema.create(AndroidSqliteDriver(db))
                                    }

                                    override fun onUpgrade(
                                        db: androidx.sqlite.db.SupportSQLiteDatabase,
                                        oldVersion: Int,
                                        newVersion: Int,
                                    ) {
                                        SeraphDb.Schema.migrate(AndroidSqliteDriver(db), oldVersion.toLong(), newVersion.toLong())
                                    }

                                    override fun onDowngrade(
                                        db: androidx.sqlite.db.SupportSQLiteDatabase,
                                        oldVersion: Int,
                                        newVersion: Int,
                                    ) {}

                                    override fun onOpen(db: androidx.sqlite.db.SupportSQLiteDatabase) {
                                        db.query("PRAGMA journal_mode=WAL").close()
                                        db.query("PRAGMA busy_timeout=5000").close()
                                    }

                                    override fun onCorruption(db: androidx.sqlite.db.SupportSQLiteDatabase) {
                                        android.util.Log.e(
                                            "SeraphDb",
                                            "Database corruption detected — preserving file, skipping delete",
                                        )
                                    }
                                },
                            ).build(),
                    ),
                )
            return SeraphDb(driver)
        }
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private lateinit var notifications: ServiceNotificationManager
    private lateinit var notificationChannel: AndroidNotificationChannel
    private lateinit var notificationWriter: NotificationWriter

    lateinit var connectionManager: ConnectionManager
        private set

    private var db: SeraphDb? = null
    private var aggregationRunner: AggregationRunner? = null

    val orchestrator = WorkOrchestrator()

    lateinit var syncRunner: SyncRunner
        private set
    lateinit var syncLoopRunner: SyncLoopRunner
        private set
    lateinit var napRunner: NapRunner
        private set
    lateinit var aggregationCoordinator: AggregationCoordinator
        private set
    var recordingRunner: RecordingRunner? = null
        private set
    var recordingManager: RecordingManager? = null
        private set

    private var blobWriter: BlobWriter? = null
    val isBlobUploadAvailable: Boolean get() = blobWriter?.isAvailable ?: false

    var uiOpen: Boolean = false
        set(value) {
            field = value
            notifications.onUiForeground(value)
            if (::notificationChannel.isInitialized) notificationChannel.isForegrounded = value
            if (value) {
                cancelPendingShutdown()
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                if (orchestrator.busy.value) {
                    startForeground(NOTIFICATION_ID, notifications.buildInitialNotification())
                }
            }
        }

    private var idleShutdownJob: Job? = null
    private var headlessTimeoutJob: Job? = null
    private var syncStateJob: Job? = null

    var onInAppNotification: ((type: String, payload: String?) -> Unit)? = null

    inner class LocalBinder : Binder() {
        val service get() = this@ForegroundService
    }

    private val binder = LocalBinder()

    override fun onCreate() {
        super.onCreate()
        notifications = ServiceNotificationManager(this)
        notifications.createChannels()

        val opened = DbHolder.db
        db = opened
        val aggRunner = AggregationRunner.build(opened)
        aggregationRunner = aggRunner
        val rm = RecordingManager(cacheDir, opened)
        recordingManager = rm

        notificationChannel =
            AndroidNotificationChannel(
                serviceNotifications = notifications,
                db = opened,
                formatSystemNotification = systemNotificationFormatter,
                onInAppNotification = { type, payload -> onInAppNotification?.invoke(type, payload) },
            )
        notificationWriter = NotificationWriter(opened, notificationChannel)

        val shardManager = ShardManager(this, opened)

        syncRunner =
            SyncRunner(
                orchestrator = orchestrator,
                r24Dao = R24Dao(opened),
                db = opened,
                aggregationRunner = aggRunner,
                scope = scope,
                onMonthRollover = { shardManager.shardEligibleMonths() },
            )

        syncLoopRunner =
            SyncLoopRunner(
                scope = scope,
                isBusy = { syncRunner.state.value.let { it is SyncState.Syncing || it is SyncState.Aggregating } },
                sync = { syncRunner.requestSync() },
            )

        napRunner =
            NapRunner(
                orchestrator = orchestrator,
                db = opened,
                syncLoopRunner = syncLoopRunner,
            )

        aggregationCoordinator =
            AggregationCoordinator(
                orchestrator = orchestrator,
                aggregationRunner = aggRunner,
                db = opened,
                notificationWriter = notificationWriter,
            )

        recordingRunner =
            RecordingRunner(
                orchestrator = orchestrator,
                recordingManager = rm,
                aggregationRunner = aggRunner,
                db = opened,
                notificationWriter = notificationWriter,
            )

        connectionManager =
            ConnectionManager(
                context = this,
                scope = scope,
                onBleReady = { device, channel ->
                    syncRunner.attachBle(
                        device = device,
                        channel = channel,
                        router = PacketRouter.build(),
                        onRawPacket = { _, raw -> blobWriter?.write("mixed", raw) },
                        onRealtimeHR = { hr -> rm.onHrSample(hr) },
                    )
                    napRunner.onAttachBle(device)
                    // If a recording is in progress (e.g. app was backgrounded),
                    // re-enable realtime HR on the strap so samples keep flowing.
                    if (rm.state.value != RecordingState.IDLE) {
                        scope.launch {
                            try {
                                device.toggleRealtimeHR(true)
                                log.i { "Re-enabled realtime HR for in-progress recording" }
                            } catch (e: Exception) {
                                log.w(e) { "Failed to re-enable realtime HR on reconnect" }
                            }
                        }
                    }
                },
                onConnected = { _, _ -> onConnected() },
                onDisconnected = { notifications.onConnectionState(ConnectionState.Disconnected) },
                onNotification = { raw -> syncRunner.onNotification(raw) },
            )

        connectionManager.connectionState
            .onEach { state -> notifications.onConnectionState(state) }
            .launchIn(scope)
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int,
    ): Int {
        startForeground(NOTIFICATION_ID, notifications.buildInitialNotification())

        val prefs = getSharedPreferences("seraph_service", MODE_PRIVATE)
        val deviceId = intent?.getStringExtra(EXTRA_DEVICE_ID) ?: prefs.getString("device_id", null)

        if (intent?.getStringExtra(EXTRA_DEVICE_ID) != null) prefs.edit().putString("device_id", deviceId).apply()

        if (deviceId != null) {
            if (blobWriter == null) {
                blobWriter = BlobWriter(applicationContext, cacheDir, deviceId, scope)
            }
            connectionManager.start(deviceId)
        }

        if (!uiOpen && headlessTimeoutJob == null) {
            headlessTimeoutJob =
                scope.launch {
                    delay(90_000L)
                    if (!uiOpen) {
                        log.w { "Headless timeout — waiting for idle before shutdown" }
                        shutdownWhenIdle()
                    }
                }
        }

        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder = binder

    fun shutdownWhenIdle() {
        if (uiOpen) return
        if (!orchestrator.busy.value) {
            log.i { "No work in progress — stopping service" }
            shutdown()
        } else {
            log.i { "Work in progress — promoting to foreground and waiting for idle" }
            startForeground(NOTIFICATION_ID, notifications.buildInitialNotification())
            idleShutdownJob?.cancel()
            idleShutdownJob =
                scope.launch {
                    orchestrator.busy.collect { busy ->
                        if (!busy) {
                            shutdown()
                            cancel()
                        }
                    }
                }
        }
    }

    private fun cancelPendingShutdown() {
        idleShutdownJob?.cancel()
        idleShutdownJob = null
        headlessTimeoutJob?.cancel()
        headlessTimeoutJob = null
    }

    override fun onDestroy() {
        syncStateJob?.cancel()
        syncStateJob = null
        scope.cancel()
        super.onDestroy()
    }

    private fun onConnected() {
        idleShutdownJob?.cancel()
        idleShutdownJob = null
        headlessTimeoutJob?.cancel()
        headlessTimeoutJob = null

        if (syncStateJob?.isActive == true) return

        syncStateJob =
            syncRunner.state
                .onEach { state ->
                    notifications.onSyncState(state)
                    if (state is SyncState.Complete) doPostSyncWork(state)
                }.launchIn(scope)

        scope.launch {
            syncRunner.onConnectReady {
                val device = connectionManager.device
                if (device != null) checkAlarm(device)
            }
        }
    }

    private fun doPostSyncWork(state: SyncState.Complete) {
        scope.launch {
            val device = connectionManager.device ?: return@launch
            val currentDb = db ?: return@launch
            notifications.checkAndNotifyBattery(device, notificationWriter)
            notifications.checkAndNotifySleepAndActivity(
                state.affectedDates,
                state.closedActivityStartTs,
                state.newSleepStartTs,
                currentDb,
                notificationWriter,
            )
            if (!uiOpen) shutdownWhenIdle()
        }
    }

    private fun shutdown() {
        if (uiOpen) {
            log.i { "shutdown() skipped — UI is open" }
            return
        }
        cancelPendingShutdown()
        stopForeground(STOP_FOREGROUND_REMOVE)
        notifications.cancelAll()
    }

    private suspend fun checkAlarm(device: Device) {
        val currentDb = db ?: return
        val alarmChecker = AlarmChecker(currentDb)
        val isConnected = connectionManager.connectionState.value is ConnectionState.Connected
        val deviceAlarm =
            if (isConnected) {
                try {
                    device.getAlarm()
                } catch (_: Exception) {
                    null
                }
            } else {
                null
            }
        val sleepGoalSec =
            currentDb.seraphDbQueries
                .getAppParameter("profile_sleep_goal_minutes")
                .executeAsOneOrNull()
                ?.let { it.toIntOrNull()?.times(60) }
                ?: (8 * 3600)

        when (val action = alarmChecker.check(deviceAlarm, isConnected)) {
            is AlarmChecker.AlarmAction.SetAlarm -> {
                try {
                    device.setAlarm(action.unixSec)
                    notifications.cancelAlarmNotification()
                    WindDownScheduler.schedule(applicationContext, action.unixSec, sleepGoalSec)
                } catch (e: Exception) {
                    log.w(e) { "Failed to set alarm" }
                }
            }
            is AlarmChecker.AlarmAction.NotifyUser -> notifications.sendAlarmNotification(notificationWriter)
            is AlarmChecker.AlarmAction.None -> {}
        }
    }

    fun saveVersionToDb(
        harvard: String,
        boylston: String,
    ) {
        val now = System.currentTimeMillis()
        db?.seraphDbQueries?.setAppParameter("firmwareHarvard", harvard, now)
        db?.seraphDbQueries?.setAppParameter("firmwareBoylston", boylston, now)
    }

    fun readVersionFromDb(): Pair<String?, String?> {
        val harvard = db?.seraphDbQueries?.getAppParameter("firmwareHarvard")?.executeAsOneOrNull()
        val boylston = db?.seraphDbQueries?.getAppParameter("firmwareBoylston")?.executeAsOneOrNull()
        return Pair(harvard, boylston)
    }
}
