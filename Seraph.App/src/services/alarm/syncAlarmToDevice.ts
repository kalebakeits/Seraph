import { getNextAlarmSeconds } from './nextAlarm';
import { nativeSetAlarm, nativeDisableAlarm } from '../ble/nativeModule';

/**
 * Reads the current alarm preferences from DB and pushes the result to the device.
 * Silently no-ops if the device is not connected — preferences are persisted in DB
 * and will be applied on next connection.
 */
export async function syncAlarmToDevice(): Promise<void> {
  try {
    const nextAlarmSeconds = await getNextAlarmSeconds();
    if (nextAlarmSeconds === null) {
      await nativeDisableAlarm();
    } else {
      await nativeSetAlarm(nextAlarmSeconds);
    }
  } catch {
    // Device not connected — alarm will sync on next connection
  }
}
