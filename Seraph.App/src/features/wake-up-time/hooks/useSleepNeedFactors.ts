import { useQuery } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { appParametersRepository } from '../../../services/database/drizzle';
import { todayISO, daysAgoISO } from '../../../utils/dateUtils';

const DEFAULT_SLEEP_GOAL = 480;

export interface SleepNeedFactors {
  goalMinutes: number;
  debtAdjMinutes: number;
  strainAdjMinutes: number;
  totalMinutes: number;
}

export function useSleepNeedFactors() {
  return useQuery({
    queryKey: ['sleepNeedFactors', todayISO()],
    queryFn: async (): Promise<SleepNeedFactors> => {
      const today = todayISO();
      const [goalStr, recentSleeps, recentAggs] = await Promise.all([
        appParametersRepository.get('profile_sleep_goal_minutes'),
        sleepEventsRepository.getRange(daysAgoISO(14)),
        dailyAggregationsRepository.getRange(daysAgoISO(14), today),
      ]);
      const goalMinutes = goalStr ? parseInt(goalStr, 10) : DEFAULT_SLEEP_GOAL;

      // Last finalized sleep on or before today (sleep belongs to the day it ends on)
      const lastSleep = recentSleeps
        .filter(s => (s.finalized === 1 || s.is_manual === 1) && s.date <= today)
        .sort((a, b) => b.date.localeCompare(a.date))
        .at(0);

      // Max strain since last sleep date through today
      const strainFrom = lastSleep ? lastSleep.date : daysAgoISO(1);
      const strain = recentAggs
        .filter(a => a.date >= strainFrom && a.date <= today)
        .reduce((max, a) => (a.strain != null && a.strain > max ? a.strain : max), 0);

      // Sleep debt: sum of sleep over the 7 days ending yesterday
      const from7 = daysAgoISO(7);
      const sleepDebtMinutes = recentSleeps
        .filter(s => (s.finalized === 1 || s.is_manual === 1) && s.date >= from7 && s.date < today)
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      const debtAdjMinutes = Math.min(Math.max(goalMinutes * 7 - sleepDebtMinutes, 0), 60);

      let strainAdjMinutes = 0;
      if (strain >= 18) strainAdjMinutes = 45;
      else if (strain >= 14) strainAdjMinutes = 30;
      else if (strain >= 10) strainAdjMinutes = 15;

      const totalMinutes = Math.min(
        Math.max(goalMinutes + debtAdjMinutes + strainAdjMinutes, 420),
        585,
      );

      return { goalMinutes, debtAdjMinutes, strainAdjMinutes, totalMinutes };
    },
    staleTime: 5 * 60 * 1000,
  });
}
