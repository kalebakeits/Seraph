import { useEffect, useRef } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { useDeviceStore } from '../features/device-management/store/deviceStore';

/**
 * On app launch or foreground resume, ensure the native foreground service
 * is started with the cached device. The service owns the sync loop —
 * this just makes sure it's running.
 */
export function useAutoConnect() {
  const initialized = useRef(false);

  const ensureServiceStarted = async () => {
    const { isConnected, isConnecting, cachedDevice, connectCached } = useDeviceStore.getState();
    if (isConnected || isConnecting || !cachedDevice) return;
    try {
      await connectCached();
    } catch {
      /* service will handle it */
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void useDeviceStore
      .getState()
      .initialize()
      .then(() => void ensureServiceStarted());
  }, []);

  // Re-poke the service when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void ensureServiceStarted();
    });
    return () => {
      sub.remove();
    };
  }, []);
}
