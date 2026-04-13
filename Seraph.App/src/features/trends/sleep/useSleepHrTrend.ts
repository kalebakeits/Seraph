import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { todayISO, daysAgoISO, buildTrendDates } from '../../../utils/dateUtils';
import type { DualAxisPoint } from '../../../components/common/SkiaDualAxisChart';
import { DUAL_AXIS_DAYS } from '../shared/dualAxisUtils';

export function useSleepHrTrend(anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const anchor = anchorDate ?? todayISO();
  const from = daysAgoISO(DUAL_AXIS_DAYS, anchor);

  return useQuery({
    queryKey: ['sleep-hr-trend', anchor, locale],
    queryFn: async (): Promise<DualAxisPoint[]> => {
      const sleeps = await sleepEventsRepository.getRange(from);
      // Primary sleep per date = lowest end_ts (first to end)
      const byDate = new Map<string, typeof sleeps[0]>();
      for (const s of sleeps) {
        const existing = byDate.get(s.date);
        if (!existing || s.end_ts < existing.end_ts) byDate.set(s.date, s);
      }

      return buildTrendDates(from, anchor, locale).map(({ dateStr, label }) => {
        const sleep = byDate.get(dateStr);
        return {
          date: dateStr,
          label,
          value: sleep?.avg_hr != null ? Math.round(sleep.avg_hr) : null,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
