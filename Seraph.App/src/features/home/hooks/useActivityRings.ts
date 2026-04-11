import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  dailyAggregationsRepository,
  sleepEventsRepository,
} from '../../../services/database/drizzle';
import { todayISO } from '../../../utils/dateUtils';

export interface ActivityRingsData {
  strain: { value: number | null; goal: number };
  recovery: { value: number | null; goal: number };
  sleep: { value: number | null; goal: number };
}

export function useActivityRings(selectedDate?: string) {
  const date = selectedDate ?? todayISO();
  return useQuery({
    queryKey: ['activityRings', date],
    queryFn: async (): Promise<ActivityRingsData> => {
      const [agg, sleep] = await Promise.all([
        dailyAggregationsRepository.getByDate(date),
        sleepEventsRepository.getFirstForDate(date),
      ]);

      return {
        strain: {
          value: agg?.strain != null ? Math.round(agg.strain * 10) / 10 : null,
          goal: 21,
        },
        recovery: { value: agg?.recovery ?? null, goal: 100 },
        sleep: {
          value: sleep?.sleep_score ?? null,
          goal: 100,
        },
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
