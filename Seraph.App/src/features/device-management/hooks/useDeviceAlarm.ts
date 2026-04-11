import { useEffect, useState } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { nativeGetAlarm } from '../../../services/ble/nativeModule';

export function useDeviceAlarm(): Date | null {
  const [alarmDate, setAlarmDate] = useState<Date | null>(null);
  const deviceReady = useDeviceStore(state => state.deviceReady);

  useEffect(() => {
    if (!deviceReady) return;
    nativeGetAlarm()
      .then(seconds => {
        if (seconds) setAlarmDate(new Date(seconds * 1000));
      })
      .catch(() => {
        /* ignore — device may not be ready */
      });
  }, [deviceReady]);

  return alarmDate;
}
