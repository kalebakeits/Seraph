import { NativeModules, NativeEventEmitter, type NativeModule } from 'react-native';

export interface NapState {
  active: boolean;
  targetMs: number | null;
  hardCutoffSec: number | null;
  mode: 'manual' | 'auto' | null;
  sleepStartTs: number | null; // ms; 0 = onset not yet detected
}

interface SeraphModuleInterface extends NativeModule {
  scan(): Promise<ScannedDevice[]>;
  stopScan(): Promise<void>;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  syncNow(opts: { lastTrim: number } | null): Promise<void>;
  abortSync(): Promise<void>;
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
  reaggregate(dates: string[]): Promise<void>;
  recalcActivity(activityId: number): Promise<void>;
  recalcSleep(sleepId: number): Promise<void>;
  refreshDailyLoad(date: string): Promise<void>;
  startNap(): Promise<void>;
  cancelNap(): Promise<void>;
  getNapState(): Promise<NapState>;
  startWorkoutRecording(sportLabel: string): Promise<void>;
  pauseWorkoutRecording(): Promise<void>;
  resumeWorkoutRecording(): Promise<void>;
  stopWorkoutRecording(): Promise<StopRecordingResult>;
  discardWorkoutRecording(): Promise<void>;
  getRecordingState(): Promise<RecordingStateInfo>;
  getLastTrim(): Promise<LastTrimInfo | null>;
  forceTrim(trimValue: number): Promise<void>;
  getDbPath(): Promise<string>;
  getDbKey(): Promise<string>;
  exportDb(): Promise<string>;
  listExportedDbs(): Promise<string[]>;
  importDb(srcPath: string, dstPath: string): Promise<void>;
  restartApp(): Promise<void>;
  getUnreadNotificationCount(): Promise<number>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  isBlobUploadAvailable(): Promise<boolean>;
  getBlobUploadConfig(): Promise<{ uploadUrl: string; bearerToken: string } | null>;
  setBlobUploadConfig(uploadUrl: string, bearerToken: string): Promise<void>;
}

const SeraphModule = NativeModules.SeraphModule as SeraphModuleInterface | undefined;

if (!SeraphModule) {
  console.warn(
    '[SeraphModule] Native module not found — BLE unavailable. Ensure SeraphModule is registered in MainApplication.kt.',
  );
}

export const seraphEmitter = new NativeEventEmitter(SeraphModule);

// Guard: if module not present, return a rejected promise instead of crashing
function call<T>(fn: (m: SeraphModuleInterface) => Promise<T>): Promise<T> {
  if (!SeraphModule) return Promise.reject(new Error('SeraphModule not available'));
  return fn(SeraphModule);
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

// ── Scanning ──────────────────────────────────────────────────────────────────

export function nativeScan(): Promise<ScannedDevice[]> {
  return call(m => m.scan());
}

export function nativeStopScan(): Promise<void> {
  return call(m => m.stopScan());
}

// ── Connection ────────────────────────────────────────────────────────────────

export function nativeConnect(deviceId: string): Promise<void> {
  return call(m => m.connect(deviceId));
}

export function nativeDisconnect(): Promise<void> {
  return call(m => m.disconnect());
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export function nativeSyncNow(lastTrim?: number): Promise<void> {
  return call(m => m.syncNow(lastTrim != null ? { lastTrim } : null));
}

export function nativeAbortSync(): Promise<void> {
  return call(m => m.abortSync());
}

// ── Device commands ───────────────────────────────────────────────────────────

export function nativeGetBattery(): Promise<{ level: number; rawValue: number }> {
  return call(m => m.getBattery());
}

export function nativeGetVersion(): Promise<{ harvard: string; boylston: string }> {
  return call(m => m.getVersion());
}

export function nativeGetHello(): Promise<{ onWrist: boolean; charging: boolean }> {
  return call(m => m.getHello());
}

export function nativeGetClock(): Promise<number> {
  return call(m => m.getClock());
}

export function nativeSetClock(unixSec?: number): Promise<void> {
  return call(m => m.setClock(unixSec ?? Math.floor(Date.now() / 1000)));
}

export function nativeGetAlarm(): Promise<number | null> {
  return call(m => m.getAlarm());
}

export function nativeSetAlarm(unixSec: number): Promise<void> {
  return call(m => m.setAlarm(unixSec));
}

export function nativeDisableAlarm(): Promise<void> {
  return call(m => m.disableAlarm());
}

export function nativeVibrate(): Promise<void> {
  return call(m => m.vibrate());
}

export function nativeHaptic(): Promise<void> {
  return call(m => m.haptic());
}

export function nativeToggleRealtimeHR(enable: boolean): Promise<void> {
  return call(m => m.toggleRealtimeHR(enable));
}

export function nativeReboot(): Promise<void> {
  return call(m => m.reboot());
}

export function nativeEraseAllData(): Promise<void> {
  return call(m => m.eraseAllData());
}

export function nativeReaggregate(dates: string[]): Promise<void> {
  return call(m => m.reaggregate(dates));
}

export function nativeRecalcActivity(activityId: number): Promise<void> {
  return call(m => m.recalcActivity(activityId));
}

export function nativeRecalcSleep(sleepId: number): Promise<void> {
  return call(m => m.recalcSleep(sleepId));
}

export function nativeRefreshDailyLoad(date: string): Promise<void> {
  return call(m => m.refreshDailyLoad(date));
}

// ── Nap ───────────────────────────────────────────────────────────────────────

export function nativeStartNap(): Promise<void> {
  return call(m => m.startNap());
}

export function nativeCancelNap(): Promise<void> {
  return call(m => m.cancelNap());
}

export function nativeGetNapState(): Promise<NapState> {
  return call(m => m.getNapState());
}

// ── Workout Recording ─────────────────────────────────────────────────────────

export interface RecordingStateInfo {
  state: 'idle' | 'recording' | 'paused';
  elapsedMs: number;
  currentHr: number | null;
}

export interface StopRecordingResult {
  activityId: number;
  date: string;
  durationMs: number;
}

export function nativeStartWorkoutRecording(sportLabel: string): Promise<void> {
  return call(m => m.startWorkoutRecording(sportLabel));
}

export function nativePauseWorkoutRecording(): Promise<void> {
  return call(m => m.pauseWorkoutRecording());
}

export function nativeResumeWorkoutRecording(): Promise<void> {
  return call(m => m.resumeWorkoutRecording());
}

export function nativeStopWorkoutRecording(): Promise<StopRecordingResult> {
  return call(m => m.stopWorkoutRecording());
}

export function nativeDiscardWorkoutRecording(): Promise<void> {
  return call(m => m.discardWorkoutRecording());
}

export function nativeGetRecordingState(): Promise<RecordingStateInfo> {
  return call(m => m.getRecordingState());
}

export interface LastTrimInfo {
  trimValue: number;
  savedAt?: number; // ms epoch — when we last persisted this trim
  r24Timestamp?: number; // ms epoch — the R24 packet that trim sequence corresponds to
}

export function nativeGetLastTrim(): Promise<LastTrimInfo | null> {
  return call(m => m.getLastTrim());
}

export function nativeForceTrim(trimValue: number): Promise<void> {
  return call(m => m.forceTrim(trimValue));
}

export function nativeGetDbPath(): Promise<string> {
  return call(m => m.getDbPath());
}

export function nativeGetDbKey(): Promise<string> {
  return call(m => m.getDbKey());
}

export function nativeExportDb(): Promise<string> {
  return call(m => m.exportDb());
}

export function nativeListExportedDbs(): Promise<string[]> {
  return call(m => m.listExportedDbs());
}

export function nativeImportDb(srcPath: string, dstPath: string): Promise<void> {
  return call(m => m.importDb(srcPath, dstPath));
}

export function nativeRestartApp(): Promise<void> {
  return call(m => m.restartApp());
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface InAppNotificationEvent {
  type: string;
  payload: string | null;
}

export function nativeGetUnreadNotificationCount(): Promise<number> {
  return call(m => m.getUnreadNotificationCount());
}

export function nativeMarkNotificationRead(id: number): Promise<void> {
  return call(m => m.markNotificationRead(id));
}

export function nativeMarkAllNotificationsRead(): Promise<void> {
  return call(m => m.markAllNotificationsRead());
}

// ── Blob upload config ────────────────────────────────────────────────────────

export function nativeIsBlobUploadAvailable(): Promise<boolean> {
  return call(m => m.isBlobUploadAvailable());
}

export function nativeGetBlobUploadConfig(): Promise<{
  uploadUrl: string;
  bearerToken: string;
} | null> {
  return call(m => m.getBlobUploadConfig());
}

export function nativeSetBlobUploadConfig(uploadUrl: string, bearerToken: string): Promise<void> {
  return call(m => m.setBlobUploadConfig(uploadUrl, bearerToken));
}
