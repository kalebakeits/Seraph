import { create } from 'zustand';
import { errorMessage } from '../../../utils/errorUtils';

import {
  seraphEmitter,
  nativeConnect,
  nativeDisconnect,
  nativeSyncNow,
  nativeScan,
  nativeGetBattery,
  nativeGetHello,
  type SyncStatus,
  type ScannedDevice,
} from '../../../services/ble/nativeModule';
import { DeviceCache, type CachedDevice } from '../../../services/ble/DeviceCache';
import { requestBluetoothPermissions } from '../../../services/ble/permissions';

interface DeviceStore {
  isConnecting: boolean;
  isConnected: boolean;
  isScanning: boolean;
  deviceReady: boolean;
  isSyncing: boolean;
  isAggregating: boolean;
  packetsReceived: number;
  latestDate: string | null;
  lastSyncedAt: number | null;
  scannedDevices: ScannedDevice[];
  cachedDevice: CachedDevice | null;
  error: string | null;
  battery: number | undefined;
  charging: boolean | undefined;
  onWrist: boolean | undefined;

  initialize: () => Promise<void>;
  scan: () => Promise<void>;
  connect: (deviceId: string, deviceName?: string | null) => Promise<void>;
  connectCached: () => Promise<void>;
  disconnect: () => Promise<void>;
  forgetDevice: () => Promise<void>;
  syncNow: (lastTrim?: number) => Promise<void>;
  setDeviceReady: (ready: boolean) => void;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceStore>((set, _get) => {
  const refreshBattery = () =>
    nativeGetBattery()
      .then(info => {
        set({ battery: Math.round(info.level) });
      })
      .catch(() => {
        /* ignore — may fail if device disconnects mid-query */
      });

  const refreshHello = () =>
    nativeGetHello()
      .then(info => {
        set({ onWrist: info.onWrist, charging: info.charging });
      })
      .catch(() => {
        /* ignore — may fail if device disconnects mid-query */
      });

  // Subscribe to native sync state events
  seraphEmitter.addListener('onSyncStateChange', (event: SyncStatus) => {
    switch (event.status) {
      case 'connecting':
        set({ isConnected: false, isConnecting: true, deviceReady: false, isSyncing: false });
        break;
      case 'connected':
        set({ isConnected: true, isConnecting: false, deviceReady: true, error: null });
        void refreshBattery();
        void refreshHello();
        break;
      case 'disconnected':
        set({
          isConnected: false,
          isConnecting: false,
          deviceReady: false,
          isSyncing: false,
          isAggregating: false,
          battery: undefined,
          charging: undefined,
          onWrist: undefined,
        });
        break;
      case 'syncing':
        set({
          isSyncing: true,
          packetsReceived: event.packetsReceived,
          latestDate: event.latestDate ?? null,
        });
        break;
      case 'aggregating':
        set({ isSyncing: false, isAggregating: true, packetsReceived: 0, latestDate: null });
        break;
      case 'complete':
        set({
          isSyncing: false,
          isAggregating: false,
          packetsReceived: 0,
          latestDate: null,
          lastSyncedAt: Date.now(),
        });
        break;
      case 'error':
        set({
          isConnected: false,
          isConnecting: false,
          isSyncing: false,
          isAggregating: false,
          deviceReady: false,
          battery: undefined,
          charging: undefined,
          onWrist: undefined,
          error: event.message,
        });
        break;
      case 'idle':
        break;
    }
  });

  seraphEmitter.addListener('onBatteryLevel', () => {
    void refreshBattery();
  });
  seraphEmitter.addListener('onChargingOn', () => {
    void refreshHello();
  });
  seraphEmitter.addListener('onChargingOff', () => {
    void refreshHello();
  });
  seraphEmitter.addListener('onWristOn', () => {
    void refreshHello();
  });
  seraphEmitter.addListener('onWristOff', () => {
    void refreshHello();
  });

  return {
    isConnecting: false,
    isConnected: false,
    isScanning: false,
    deviceReady: false,
    isSyncing: false,
    isAggregating: false,
    packetsReceived: 0,
    lastSyncedAt: null,
    latestDate: null,
    scannedDevices: [],
    cachedDevice: null,
    error: null,
    battery: undefined,
    charging: undefined,
    onWrist: undefined,

    setDeviceReady: ready => {
      set({ deviceReady: ready });
    },
    clearError: () => {
      set({ error: null });
    },

    scan: async () => {
      set({ isScanning: true, scannedDevices: [], error: null });
      try {
        const granted = await requestBluetoothPermissions();
        if (!granted) {
          set({ error: 'Bluetooth permissions denied', isScanning: false });
          return;
        }
        const results = await nativeScan();
        set({ scannedDevices: results, isScanning: false });
      } catch (e) {
        set({ error: errorMessage(e), isScanning: false });
      }
    },

    initialize: async () => {
      const cached = await DeviceCache.getDevice();
      if (cached) set({ cachedDevice: cached });
    },

    connect: async (deviceId, deviceName) => {
      set({ isConnecting: true, error: null });
      try {
        await DeviceCache.saveDevice({
          id: deviceId,
          name: deviceName ?? 'Unknown Device',
          lastConnected: Date.now(),
        });
        set({ cachedDevice: await DeviceCache.getDevice() });
        // nativeConnect starts the foreground service and resolves immediately.
        // isConnecting stays true until the onSyncStateChange listener fires
        // 'connected' (sets isConnected + clears isConnecting) or we get an error.
        await nativeConnect(deviceId);
      } catch (e) {
        set({ error: errorMessage(e), isConnecting: false });
      }
    },

    connectCached: async () => {
      const cached = await DeviceCache.getDevice();
      if (!cached) return;
      set({ isConnecting: true, error: null });
      try {
        // Same as connect: let the onSyncStateChange listener handle isConnecting.
        await nativeConnect(cached.id);
      } catch (e) {
        set({ error: errorMessage(e), isConnecting: false });
      }
    },

    disconnect: async () => {
      try {
        await nativeDisconnect();
        set({ isConnected: false, deviceReady: false, isSyncing: false, error: null });
      } catch (e) {
        set({ error: errorMessage(e) });
      }
    },

    forgetDevice: async () => {
      try {
        await DeviceCache.clearDevice();
        await nativeDisconnect();
        set({
          cachedDevice: null,
          isConnected: false,
          deviceReady: false,
          isSyncing: false,
          error: null,
        });
      } catch (e) {
        set({ error: errorMessage(e) });
      }
    },

    syncNow: async () => {
      try {
        await nativeSyncNow();
      } catch (e) {
        set({ error: errorMessage(e) });
      }
    },
  };
});
