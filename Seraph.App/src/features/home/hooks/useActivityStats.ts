import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../../../services/database/drizzle';
import { todayISO, daysAgoISO } from '../../../utils/dateUtils';

interface DayStats {
  steps: number | null;
  activeMinutes: number | null;
  hrv: number | null;
  rhr: number | null;
  skinTemp: number | null;
  dailyStress: number | null;
}

interface ActivityStats {
  today: DayStats;
  sevenDayAvg: DayStats;
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function useActivityStats(selectedDate?: string) {
  const date = selectedDate ?? todayISO();

  return useQuery({
    queryKey: ['activityStats', date],
    queryFn: async (): Promise<ActivityStats> => {
      const sevenDayFrom = daysAgoISO(7, date);

      const [todayAgg, sevenDayRows] = await Promise.all([
        dailyAggregationsRepository.getByDate(date),
        dailyAggregationsRepository.getRange(sevenDayFrom, date),
      ]);

      // Exclude today from the 7-day average so we compare today vs prior 7 days
      const priorRows = sevenDayRows.filter(r => r.date !== date);

      const today: DayStats = {
        steps: todayAgg?.steps ?? null,
        activeMinutes: todayAgg?.active_minutes ?? null,
        hrv: todayAgg?.hrv_rmssd != null ? Math.round(todayAgg.hrv_rmssd) : null,
        rhr: todayAgg?.rhr != null ? Math.round(todayAgg.rhr) : null,
        skinTemp: todayAgg?.skin_temp ?? null,
        dailyStress: todayAgg?.daily_stress ?? null,
      };

      const sevenDayAvg: DayStats = {
        steps: avg(priorRows.map(r => r.steps ?? null)),
        activeMinutes: avg(priorRows.map(r => r.active_minutes ?? null)),
        hrv: avg(priorRows.map(r => (r.hrv_rmssd != null ? Math.round(r.hrv_rmssd) : null))),
        rhr: avg(priorRows.map(r => (r.rhr != null ? Math.round(r.rhr) : null))),
        skinTemp: avg(priorRows.map(r => r.skin_temp ?? null)),
        dailyStress: avg(priorRows.map(r => r.daily_stress ?? null)),
      };

      return { today, sevenDayAvg };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
