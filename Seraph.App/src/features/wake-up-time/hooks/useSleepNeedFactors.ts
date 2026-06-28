import { useQuery } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { appParametersRepository } from '../../../services/database/drizzle';
import { buildSleepNeedFactors, type SleepNeedFactors } from '../utils/sleepNeedFactors';

export type { SleepNeedFactors } from '../utils/sleepNeedFactors';

const DEFAULT_SLEEP_GOAL = 480;

export function useSleepNeedFactors(date: string) {
  return useQuery({
    queryKey: ['sleepNeedFactors', date],
    queryFn: async (): Promise<SleepNeedFactors> => {
      const [goalStr, agg] = await Promise.all([
        appParametersRepository.get('profile_sleep_goal_minutes'),
        dailyAggregationsRepository.getByDate(date),
      ]);
      const goalMinutes = goalStr ? parseInt(goalStr, 10) : DEFAULT_SLEEP_GOAL;
      return buildSleepNeedFactors(
        goalMinutes,
        agg?.sleep_need ?? null,
        agg?.sleep_need_factors ?? null,
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
