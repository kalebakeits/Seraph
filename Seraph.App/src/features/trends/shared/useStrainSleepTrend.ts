import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { todayISO, daysAgoISO, addDaysISO, buildTrendDates } from '../../../utils/dateUtils';
import type { DualAxisPoint } from '../../../components/common/SkiaDualAxisChart';
import { DUAL_AXIS_DAYS, type DualAxisData } from './dualAxisUtils';

export function useStrainSleepTrend(anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const anchor = anchorDate ?? todayISO();
  const from = daysAgoISO(DUAL_AXIS_DAYS, anchor);

  return useQuery({
    queryKey: ['dual-strain-sleep', anchor, locale],
    queryFn: async (): Promise<DualAxisData> => {
      const extFrom = addDaysISO(from, -1);
      const rows = await dailyAggregationsRepository.getRange(extFrom, anchor);
      const aggByDate = new Map(rows.map(r => [r.date, r]));
      const dates = buildTrendDates(from, anchor, locale);

      const sleepResults = await Promise.all(
        dates.map(({ dateStr }) => sleepEventsRepository.getFirstForDate(dateStr)),
      );

      // Strain is offset by -1 day: today's sleep is affected by yesterday's strain
      const left: DualAxisPoint[] = dates.map(({ dateStr, label }) => ({
        date: dateStr,
        label,
        value: aggByDate.get(addDaysISO(dateStr, -1))?.strain ?? null,
      }));

      const right: DualAxisPoint[] = dates.map(({ dateStr, label }, i) => ({
        date: dateStr,
        label,
        value: sleepResults[i]?.duration_minutes ?? null,
      }));

      return { left, right };
    },
    staleTime: 5 * 60 * 1000,
  });
}
