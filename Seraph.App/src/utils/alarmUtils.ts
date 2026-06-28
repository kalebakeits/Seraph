/**
 * Calculate next occurrence of a time (for one-off alarms)
 * Takes hours and minutes, returns next occurrence as Unix timestamp in seconds
 */
export function calculateNextOccurrenceSeconds(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  const alarm = new Date(now);
  alarm.setHours(hour, minute, 0, 0);

  // If time has passed today, set for tomorrow
  if (alarm <= now) {
    alarm.setDate(alarm.getDate() + 1);
  }

  return Math.floor(alarm.getTime() / 1000);
}

export interface AlarmTriggerForNextSleepInterval {
  willTrigger: boolean;
  nextAlarmSeconds: number | null;
}

export function calculateAlarmTriggerForNextSleepInterval(
  time: string,
  mode: 'single' | 'schedule' | 'disabled',
  schedule: number[],
  now: Date = new Date(),
): AlarmTriggerForNextSleepInterval {
  if (mode === 'disabled') {
    return { willTrigger: false, nextAlarmSeconds: null };
  }

  const [hour, minute] = time.split(':').map(Number);
  const alarm = new Date(now);
  alarm.setHours(hour, minute, 0, 0);

  if (mode === 'single') {
    const nextAlarmSeconds = alarm > now ? Math.floor(alarm.getTime() / 1000) : null;
    return { willTrigger: nextAlarmSeconds !== null, nextAlarmSeconds };
  }

  if (alarm <= now) {
    alarm.setDate(alarm.getDate() + 1);
  }

  const nextAlarmSeconds =
    schedule[alarm.getDay()] === 1 ? Math.floor(alarm.getTime() / 1000) : null;
  return { willTrigger: nextAlarmSeconds !== null, nextAlarmSeconds };
}
