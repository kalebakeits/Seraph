import { useEffect, useState } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { nativeGetClock } from '../../../services/ble/nativeModule';

export function useDeviceClock(): Date | null {
  const [clockDate, setClockDate] = useState<Date | null>(null);
  const deviceReady = useDeviceStore(state => state.deviceReady);

  useEffect(() => {
    if (!deviceReady) return;
    nativeGetClock()
      .then(seconds => {
        if (seconds > 0) setClockDate(new Date(seconds * 1000));
      })
      .catch(() => {
        /* ignore — device may not be ready */
      });
  }, [deviceReady]);

  return clockDate;
}
