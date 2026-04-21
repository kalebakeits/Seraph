import { useQuery } from '@tanstack/react-query';
import {
  habitLogsRepository,
  habitDefinitionsRepository,
} from '../../../services/database/drizzle';
import { daysAgoISO, addDaysISO, todayISO } from '../../../utils/dateUtils';

export interface ConsistencyDay {
  date: string;
  /** Number of active habits logged on this day */
  logged: number;
  /** Total active habits */
  total: number;
}

/** Returns `days` days of habit consistency ending on `anchor` (inclusive). */
export function useHabitConsistency(days = 7, anchor?: string) {
  return useQuery({
    queryKey: ['habitConsistency', days, anchor],
    queryFn: async (): Promise<ConsistencyDay[]> => {
      const today = todayISO();
      const endDate = anchor ?? today;
      const startDate = daysAgoISO(days - 1, endDate);

      const [activeHabits, logs] = await Promise.all([
        habitDefinitionsRepository.getActive(),
        habitLogsRepository.getForRange(startDate, endDate),
      ]);

      const total = activeHabits.length;
      const activeIds = new Set(activeHabits.map(h => h.id));

      const result: ConsistencyDay[] = [];
      for (let i = 0; i < days; i++) {
        const date = addDaysISO(startDate, i);
        const logged = logs.filter(l => l.date === date && activeIds.has(l.habit_id)).length;
        result.push({ date, logged, total });
      }
      return result;
    },
  });
}
