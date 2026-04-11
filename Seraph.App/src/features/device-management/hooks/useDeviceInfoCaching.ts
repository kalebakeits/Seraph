import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeviceStore } from '../store/deviceStore';
import { DeviceCache } from '../../../services/ble/DeviceCache';
import { useCachedDevice } from './useCachedDevice';
import { nativeGetVersion } from '../../../services/ble/nativeModule';

export function useDeviceInfoCaching() {
  const deviceReady = useDeviceStore(state => state.deviceReady);
  const { data: cachedDevice } = useCachedDevice();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deviceReady || !cachedDevice) return;

    nativeGetVersion()
      .then(async info => {
        await DeviceCache.saveDevice({
          ...cachedDevice,
          firmwareVersion: info.harvard,
          hardwareVersion: info.boylston,
        });
        // Invalidate so useCachedDevice re-reads the updated firmware version
        void queryClient.invalidateQueries({ queryKey: ['cachedDevice'] });
      })
      .catch(() => {
        /* ignore — version fetch may fail if device disconnects */
      });
  }, [deviceReady, cachedDevice, queryClient]);
}
