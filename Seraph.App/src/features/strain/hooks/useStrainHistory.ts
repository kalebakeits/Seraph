import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { activityEventsRepository } from '../../../services/database/drizzle';
import { todayISO, addDaysISO } from '../../../utils/dateUtils';
import type { ZoneSeconds } from '../../../services/database/drizzle/schema';

export interface StrainDay {
  date: string;
  weekday: string;
  day: string;
  strain: number | null;
  lowZoneMin: number;
  highZoneMin: number;
}

export function useStrainHistory(anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const date = anchorDate ?? todayISO();

  return useQuery<StrainDay[]>({
    queryKey: ['strainHistory7d', date, locale],
    queryFn: async () => {
      const from = addDaysISO(date, -6);
      const rows = await dailyAggregationsRepository.getRange(from, date);
      const rowMap = new Map(rows.map(r => [r.date, r]));

      return Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const d = addDaysISO(date, i - 6);
          const row = rowMap.get(d);
          const dt = new Date(d + 'T12:00:00Z');

          const events = await activityEventsRepository.getByDate(d);
          let z2 = 0,
            z3 = 0,
            z4 = 0,
            z5 = 0;
          for (const e of events) {
            if (!e.zone_seconds) continue;
            const z = JSON.parse(e.zone_seconds) as ZoneSeconds;
            z2 += z.z2;
            z3 += z.z3;
            z4 += z.z4;
            z5 += z.z5;
          }

          return {
            date: d,
            weekday: dt.toLocaleDateString(locale, { weekday: 'short' }),
            day: String(dt.getUTCDate()),
            strain: row?.strain != null ? Math.round(row.strain * 10) / 10 : null,
            lowZoneMin: (z2 + z3) / 60,
            highZoneMin: (z4 + z5) / 60,
          };
        }),
      );
    },
    staleTime: 0,
  });
}
