import { NativeModules, NativeEventEmitter, type NativeModule } from 'react-native';

// ── Module interfaces ─────────────────────────────────────────────────────────

type SeraphModuleInterface = NativeModule;

interface SyncModuleInterface extends NativeModule {
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  syncNow(opts: { lastTrim: number } | null): Promise<void>;
  abortSync(): Promise<void>;
  forceTrim(trimValue: number): Promise<void>;
  getLastTrim(): Promise<LastTrimInfo | null>;
  reaggregate(dates: string[]): Promise<void>;
  recalcActivity(activityId: number): Promise<void>;
  recalcSleep(sleepId: number): Promise<void>;
  refreshDailyLoad(date: string): Promise<void>;
  getInitialDeepLink(): Promise<string | null>;
}

interface DeviceModuleInterface extends NativeModule {
  scan(): Promise<ScannedDevice[]>;
  stopScan(): Promise<void>;
  getBattery(): Promise<{ level: number; rawValue: number }>;
  getVersion(): Promise<{ harvard: string; boylston: string }>;
  getHello(): Promise<{ onWrist: boolean; charging: boolean }>;
  getClock(): Promise<number>;
  setClock(unixSec: number): Promise<void>;
  getAlarm(): Promise<number | null>;
  setAlarm(unixSec: number): Promise<void>;
  disableAlarm(): Promise<void>;
  vibrate(): Promise<void>;
  haptic(): Promise<void>;
  toggleRealtimeHR(enable: boolean): Promise<void>;
  reboot(): Promise<void>;
  eraseAllData(): Promise<void>;
}

interface RecordingModuleInterface extends NativeModule {
  startWorkoutRecording(sportLabel: string): Promise<void>;
  pauseWorkoutRecording(): Promise<void>;
  resumeWorkoutRecording(): Promise<void>;
  stopWorkoutRecording(): Promise<StopRecordingResult>;
  discardWorkoutRecording(): Promise<void>;
  getRecordingState(): Promise<RecordingStateInfo>;
}

interface NapModuleInterface extends NativeModule {
  startNap(): Promise<void>;
  cancelNap(): Promise<void>;
  getNapState(): Promise<NapState>;
}

interface NotificationModuleInterface extends NativeModule {
  getUnreadNotificationCount(): Promise<number>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
}

interface DevToolsModuleInterface extends NativeModule {
  getDbKey(): Promise<string>;
  exportDb(): Promise<string>;
  importDb(srcPaths: string[], destNames: string[]): Promise<void>;
  restartApp(): Promise<void>;
  isBlobUploadAvailable(): Promise<boolean>;
  getBlobUploadConfig(): Promise<{ uploadUrl: string; bearerToken: string } | null>;
  setBlobUploadConfig(uploadUrl: string, bearerToken: string): Promise<void>;
}

// ── Module instances ──────────────────────────────────────────────────────────

const SeraphModule = NativeModules.SeraphModule as SeraphModuleInterface | undefined;
const SyncModule = NativeModules.SyncModule as SyncModuleInterface | undefined;
const DeviceModule = NativeModules.DeviceModule as DeviceModuleInterface | undefined;
const RecordingModule = NativeModules.RecordingModule as RecordingModuleInterface | undefined;
const NapModule = NativeModules.NapModule as NapModuleInterface | undefined;
const NotificationModule = NativeModules.NotificationModule as
  | NotificationModuleInterface
  | undefined;
const DevToolsModule = NativeModules.DevToolsModule as DevToolsModuleInterface | undefined;

if (!SeraphModule) console.warn('[SeraphModule] Not found — events unavailable');

export const seraphEmitter = new NativeEventEmitter(SeraphModule);

function callSync<T>(fn: (m: SyncModuleInterface) => Promise<T>): Promise<T> {
  if (!SyncModule) return Promise.reject(new Error('SyncModule not available'));
  return fn(SyncModule);
}
function callDevice<T>(fn: (m: DeviceModuleInterface) => Promise<T>): Promise<T> {
  if (!DeviceModule) return Promise.reject(new Error('DeviceModule not available'));
  return fn(DeviceModule);
}
function callRecording<T>(fn: (m: RecordingModuleInterface) => Promise<T>): Promise<T> {
  if (!RecordingModule) return Promise.reject(new Error('RecordingModule not available'));
  return fn(RecordingModule);
}
function callNap<T>(fn: (m: NapModuleInterface) => Promise<T>): Promise<T> {
  if (!NapModule) return Promise.reject(new Error('NapModule not available'));
  return fn(NapModule);
}
function callNotif<T>(fn: (m: NotificationModuleInterface) => Promise<T>): Promise<T> {
  if (!NotificationModule) return Promise.reject(new Error('NotificationModule not available'));
  return fn(NotificationModule);
}
function callDevTools<T>(fn: (m: DevToolsModuleInterface) => Promise<T>): Promise<T> {
  if (!DevToolsModule) return Promise.reject(new Error('DevToolsModule not available'));
  return fn(DevToolsModule);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NapState {
  active: boolean;
  targetMs: number | null;
  hardCutoffSec: number | null;
  mode: 'manual' | 'auto' | null;
  sleepStartTs: number | null;
}

export type SyncStatus =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'connected' }
  | { status: 'syncing'; packetsReceived: number; latestDate?: string }
  | { status: 'aggregating' }
  | { status: 'complete'; affectedDates: string[] }
  | { status: 'error'; message: string }
  | { status: 'disconnected' };

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number;
}
export interface RecordingStateInfo {
  state: 'idle' | 'recording' | 'paused' | 'auto_paused';
  elapsedMs: number;
  currentHr: number | null;
}
export interface StopRecordingResult {
  activityId: number;
  date: string;
  durationMs: number;
}
export interface LastTrimInfo {
  trimValue: number;
  savedAt?: number;
  r24Timestamp?: number;
}
export interface InAppNotificationEvent {
  type: string;
  payload: string | null;
}

// ── Scanning ──────────────────────────────────────────────────────────────────

export const nativeScan = (): Promise<ScannedDevice[]> => callDevice(m => m.scan());
export const nativeStopScan = (): Promise<void> => callDevice(m => m.stopScan());

// ── Connection ────────────────────────────────────────────────────────────────

export const nativeConnect = (deviceId: string): Promise<void> =>
  callSync(m => m.connect(deviceId));
export const nativeDisconnect = (): Promise<void> => callSync(m => m.disconnect());

// ── Sync ──────────────────────────────────────────────────────────────────────

export const nativeSyncNow = (lastTrim?: number): Promise<void> =>
  callSync(m => m.syncNow(lastTrim != null ? { lastTrim } : null));
export const nativeAbortSync = (): Promise<void> => callSync(m => m.abortSync());
export const nativeForceTrim = (trimValue: number): Promise<void> =>
  callSync(m => m.forceTrim(trimValue));
export const nativeGetLastTrim = (): Promise<LastTrimInfo | null> => callSync(m => m.getLastTrim());
export const nativeReaggregate = (dates: string[]): Promise<void> =>
  callSync(m => m.reaggregate(dates));
export const nativeRecalcActivity = (activityId: number): Promise<void> =>
  callSync(m => m.recalcActivity(activityId));
export const nativeRecalcSleep = (sleepId: number): Promise<void> =>
  callSync(m => m.recalcSleep(sleepId));
export const nativeRefreshDailyLoad = (date: string): Promise<void> =>
  callSync(m => m.refreshDailyLoad(date));
export const nativeGetInitialDeepLink = (): Promise<string | null> =>
  callSync(m => m.getInitialDeepLink());

// ── Device commands ───────────────────────────────────────────────────────────

export const nativeGetBattery = (): Promise<{ level: number; rawValue: number }> =>
  callDevice(m => m.getBattery());
export const nativeGetVersion = (): Promise<{ harvard: string; boylston: string }> =>
  callDevice(m => m.getVersion());
export const nativeGetHello = (): Promise<{ onWrist: boolean; charging: boolean }> =>
  callDevice(m => m.getHello());
export const nativeGetClock = (): Promise<number> => callDevice(m => m.getClock());
export const nativeSetClock = (unixSec?: number): Promise<void> =>
  callDevice(m => m.setClock(unixSec ?? Math.floor(Date.now() / 1000)));
export const nativeGetAlarm = (): Promise<number | null> => callDevice(m => m.getAlarm());
export const nativeSetAlarm = (unixSec: number): Promise<void> =>
  callDevice(m => m.setAlarm(unixSec));
export const nativeDisableAlarm = (): Promise<void> => callDevice(m => m.disableAlarm());
export const nativeVibrate = (): Promise<void> => callDevice(m => m.vibrate());
export const nativeHaptic = (): Promise<void> => callDevice(m => m.haptic());
export const nativeToggleRealtimeHR = (enable: boolean): Promise<void> =>
  callDevice(m => m.toggleRealtimeHR(enable));
export const nativeReboot = (): Promise<void> => callDevice(m => m.reboot());
export const nativeEraseAllData = (): Promise<void> => callDevice(m => m.eraseAllData());

// ── Nap ───────────────────────────────────────────────────────────────────────

export const nativeStartNap = (): Promise<void> => callNap(m => m.startNap());
export const nativeCancelNap = (): Promise<void> => callNap(m => m.cancelNap());
export const nativeGetNapState = (): Promise<NapState> => callNap(m => m.getNapState());

// ── Workout Recording ─────────────────────────────────────────────────────────

export const nativeStartWorkoutRecording = (sportLabel: string): Promise<void> =>
  callRecording(m => m.startWorkoutRecording(sportLabel));
export const nativePauseWorkoutRecording = (): Promise<void> =>
  callRecording(m => m.pauseWorkoutRecording());
export const nativeResumeWorkoutRecording = (): Promise<void> =>
  callRecording(m => m.resumeWorkoutRecording());
export const nativeStopWorkoutRecording = (): Promise<StopRecordingResult> =>
  callRecording(m => m.stopWorkoutRecording());
export const nativeDiscardWorkoutRecording = (): Promise<void> =>
  callRecording(m => m.discardWorkoutRecording());
export const nativeGetRecordingState = (): Promise<RecordingStateInfo> =>
  callRecording(m => m.getRecordingState());

// ── Notifications ─────────────────────────────────────────────────────────────

export const nativeGetUnreadNotificationCount = (): Promise<number> =>
  callNotif(m => m.getUnreadNotificationCount());
export const nativeMarkNotificationRead = (id: number): Promise<void> =>
  callNotif(m => m.markNotificationRead(id));
export const nativeMarkAllNotificationsRead = (): Promise<void> =>
  callNotif(m => m.markAllNotificationsRead());

// ── Dev tools ─────────────────────────────────────────────────────────────────

export const nativeGetDbKey = (): Promise<string> => callDevTools(m => m.getDbKey());
export const nativeExportDb = (): Promise<string> => callDevTools(m => m.exportDb());
export const nativeImportDb = (srcPaths: string[], destNames: string[]): Promise<void> =>
  callDevTools(m => m.importDb(srcPaths, destNames));
export const nativeRestartApp = (): Promise<void> => callDevTools(m => m.restartApp());
export const nativeIsBlobUploadAvailable = (): Promise<boolean> =>
  callDevTools(m => m.isBlobUploadAvailable());
export const nativeGetBlobUploadConfig = (): Promise<{
  uploadUrl: string;
  bearerToken: string;
} | null> => callDevTools(m => m.getBlobUploadConfig());
export const nativeSetBlobUploadConfig = (uploadUrl: string, bearerToken: string): Promise<void> =>
  callDevTools(m => m.setBlobUploadConfig(uploadUrl, bearerToken));
