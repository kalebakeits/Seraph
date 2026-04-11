import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { todayISO } from '../../../utils/dateUtils';

export interface RecoveryDay {
  date: string;
  weekday: string;
  day: string;
  recovery: number | null;
  hrv: number | null;
  rhr: number | null;
  sleepMin: number | null;
}

const DAYS_TO_SHOW = 7;

export function useRecoveryHistory(anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const to = anchorDate ?? todayISO();
  return useQuery({
    queryKey: ['recovery-history', to, locale],
    queryFn: async () => {
      const toDate = new Date(to + 'T12:00:00');
      const fromDate = new Date(toDate);
      fromDate.setDate(fromDate.getDate() - (DAYS_TO_SHOW - 1));
      const fromStr = fromDate.toISOString().slice(0, 10);

      const rows = await dailyAggregationsRepository.getRange(fromStr, to);
      const aggByDate = new Map(rows.map(r => [r.date, r]));

      const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
        const d = new Date(fromDate);
        d.setDate(d.getDate() + i);
        return { dateStr: d.toISOString().slice(0, 10), d };
      });

      const sleepResults = await Promise.all(
        dates.map(({ dateStr }) => sleepEventsRepository.getFirstForDate(dateStr)),
      );

      const days: RecoveryDay[] = dates.map(({ dateStr, d }, i) => {
        const agg = aggByDate.get(dateStr);
        const sleepMin = sleepResults[i]?.duration_minutes ?? null;
        return {
          date: dateStr,
          weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
          day: d.toLocaleDateString(locale, { day: 'numeric' }),
          recovery: agg?.recovery != null ? Math.round(agg.recovery) : null,
          hrv: agg?.hrv_rmssd != null ? Math.round(agg.hrv_rmssd) : null,
          rhr: agg?.rhr != null ? Math.round(agg.rhr) : null,
          sleepMin,
        };
      });
      return days;
    },
  });
}
