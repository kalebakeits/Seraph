import {
  calculateAlarmTriggerForNextSleepInterval,
  calculateNextOccurrenceSeconds,
} from '../../utils/alarmUtils';
import type { AlarmTriggerForNextSleepInterval } from '../../utils/alarmUtils';
import {
  getAlarmTime,
  getAlarmMode,
  getAlarmSchedule,
  getAlarmSingleTs,
} from '../database/userPreferences/alarmPreferences';

/**
 * Pure function to get the next alarm time in Unix seconds
 * Can be called from hooks or headless JS
 */
export async function getNextAlarmSeconds(): Promise<number | null> {
  const alarmTime = await getAlarmTime();
  const alarmMode = await getAlarmMode();

  if (alarmMode === 'disabled' || !alarmTime) {
    return null;
  }

  const nextAlarmTime = calculateNextOccurrenceSeconds(alarmTime);

  if (alarmMode === 'single') {
    const singleTs = await getAlarmSingleTs();
    return singleTs != null && singleTs > Math.floor(Date.now() / 1000) ? singleTs : null;
  }

  // Schedule mode: walk forward up to 7 days to find the next enabled day
  const schedule = await getAlarmSchedule();
  const SECONDS_PER_DAY = 86400;
  let candidate = nextAlarmTime;
  for (let i = 0; i < 7; i++) {
    const day = new Date(candidate * 1000).getDay();
    if (schedule[day] === 1) return candidate;
    candidate += SECONDS_PER_DAY;
  }
  return null;
}

export async function getAlarmTriggerForNextSleepInterval(): Promise<AlarmTriggerForNextSleepInterval> {
  const [alarmTime, alarmMode, schedule, singleTs] = await Promise.all([
    getAlarmTime(),
    getAlarmMode(),
    getAlarmSchedule(),
    getAlarmSingleTs(),
  ]);

  if (!alarmTime) return { willTrigger: false, nextAlarmSeconds: null };
  if (alarmMode === 'single') {
    const nextAlarmSeconds =
      singleTs != null && singleTs > Math.floor(Date.now() / 1000) ? singleTs : null;
    return { willTrigger: nextAlarmSeconds !== null, nextAlarmSeconds };
  }
  return calculateAlarmTriggerForNextSleepInterval(alarmTime, alarmMode, schedule);
}
