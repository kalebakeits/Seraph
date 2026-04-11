import { useEffect } from 'react';
import { useDeviceStore } from '../features/device-management/store/deviceStore';
import { useDeviceInfoCaching } from '../features/device-management/hooks/useDeviceInfoCaching';

/**
 * Marks the device as ready once native reports connected.
 * Clock sync and aggregation are handled by the native foreground service.
 */
export function useDeviceInit() {
  const isConnected = useDeviceStore(state => state.isConnected);
  const setDeviceReady = useDeviceStore(state => state.setDeviceReady);

  useDeviceInfoCaching(); // calls nativeGetVersion (try strap → DB fallback), saves to DeviceCache for UI

  useEffect(() => {
    setDeviceReady(isConnected);
  }, [isConnected, setDeviceReady]);
}
