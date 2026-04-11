import { calculateNextOccurrenceSeconds } from '../../utils/alarmUtils';
import {
  getAlarmTime,
  getAlarmMode,
  getAlarmSchedule,
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
    return nextAlarmTime;
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
