import { useQuery } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { appParametersRepository } from '../../../services/database/drizzle';
import { todayISO } from '../../../utils/dateUtils';
import { buildSleepNeedFactors, type SleepNeedFactors } from '../utils/sleepNeedFactors';

export type { SleepNeedFactors } from '../utils/sleepNeedFactors';

const DEFAULT_SLEEP_GOAL = 480;

export function useSleepNeedFactors() {
  return useQuery({
    queryKey: ['sleepNeedFactors', todayISO()],
    queryFn: async (): Promise<SleepNeedFactors> => {
      const today = todayISO();
      const [goalStr, todayAgg] = await Promise.all([
        appParametersRepository.get('profile_sleep_goal_minutes'),
        dailyAggregationsRepository.getByDate(today),
      ]);
      const goalMinutes = goalStr ? parseInt(goalStr, 10) : DEFAULT_SLEEP_GOAL;
      return buildSleepNeedFactors(
        goalMinutes,
        todayAgg?.sleep_need ?? null,
        todayAgg?.sleep_need_factors ?? null,
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
