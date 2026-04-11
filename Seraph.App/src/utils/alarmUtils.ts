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
