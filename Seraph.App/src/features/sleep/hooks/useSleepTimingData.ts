import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sleepEventsRepository } from '../../../services/database/drizzle';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { todayISO, addDaysISO, tsToDecimalHour } from '../../../utils/dateUtils';

export interface SleepNight {
  date: string;
  weekday: string;
  day: string;
  bedHour: number | null;
  wakeHour: number | null;
  durationMin: number | null;
  recovery: number | null;
  bedTs: number | null;
  wakeTs: number | null;
}

export function useSleepTimingData(anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const date = anchorDate ?? todayISO();

  return useQuery<SleepNight[]>({
    queryKey: ['sleepTiming7d', date, locale],
    queryFn: async () => {
      return Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const d = addDaysISO(date, i - 6);
          const dt = new Date(d + 'T12:00:00Z');
          const [sleep, agg] = await Promise.all([
            sleepEventsRepository.getFirstForDate(d),
            dailyAggregationsRepository.getByDate(d),
          ]);

          let bedHour: number | null = null;
          let wakeHour: number | null = null;
          let durationMin: number | null = null;
          let bedTs: number | null = null;
          let wakeTs: number | null = null;

          if (sleep) {
            const bh = tsToDecimalHour(sleep.start_ts, true);
            let wh = tsToDecimalHour(sleep.end_ts);
            if (wh < bh - 12) wh += 24;
            bedHour = bh;
            wakeHour = wh;
            durationMin = sleep.duration_minutes;
            bedTs = sleep.start_ts;
            wakeTs = sleep.end_ts;
          }

          return {
            date: d,
            weekday: dt.toLocaleDateString(locale, { weekday: 'short' }),
            day: String(dt.getUTCDate()),
            bedHour,
            wakeHour,
            durationMin,
            recovery: agg?.recovery != null ? Math.round(agg.recovery) : null,
            bedTs,
            wakeTs,
          };
        }),
      );
    },
    staleTime: 0,
  });
}
