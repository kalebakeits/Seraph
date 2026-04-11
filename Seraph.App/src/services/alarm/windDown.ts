import { dailyAggregationsRepository } from '../database/drizzle/repositories/dailyAggregationsRepository';
import { appParametersRepository } from '../database/drizzle/repositories/appParametersRepository';
import { todayISO } from '../../utils/dateUtils';

const WIND_DOWN_MINUTES = 120;

/**
 * Returns today's sleep need in minutes.
 * Prefers the computed sleep_need from daily_aggregations; falls back to profile goal.
 */
async function getSleepNeedMinutes(): Promise<number> {
  const [todayAgg, goalStr] = await Promise.all([
    dailyAggregationsRepository.getByDate(todayISO()),
    appParametersRepository.get('profile_sleep_goal_minutes'),
  ]);
  const goalFallback = goalStr ? parseInt(goalStr, 10) : 480;
  return todayAgg?.sleep_need != null ? Math.round(todayAgg.sleep_need) : goalFallback;
}

/**
 * Pure async function to check if within wind down period.
 * Wind-down window = [alarm - sleep_need - 2h, alarm].
 */
export async function getWithinWindDown(nextAlarmSeconds: number | null): Promise<boolean> {
  if (!nextAlarmSeconds) return false;

  const sleepNeedMinutes = await getSleepNeedMinutes();
  const nextAlarmMinutes = nextAlarmSeconds / 60;
  const nowMinutes = Date.now() / 1000 / 60;

  return (
    nowMinutes > nextAlarmMinutes - sleepNeedMinutes - WIND_DOWN_MINUTES &&
    nowMinutes < nextAlarmMinutes
  );
}
