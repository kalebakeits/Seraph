import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sleepEventsRepository } from '../../../services/database/drizzle';
import { todayISO, daysAgoISO } from '../../../utils/dateUtils';

export interface SleepWeekDay {
  date: string;
  weekday: string;
  day: string;
  sleepMinutes: number;
  awakeMinutes: number;
}

export function useSleepWeekData(anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const anchor = anchorDate ?? todayISO();
  const from = daysAgoISO(6, anchor);

  return useQuery({
    queryKey: ['sleepWeekData', anchor, locale],
    queryFn: async () => {
      const events = await sleepEventsRepository.getRange(from);

      // Group by date, pick longest sleep per date
      const byDate = new Map<string, { sleepMinutes: number; awakeMinutes: number }>();
      for (const e of events) {
        if (e.date < from || e.date > anchor) continue;
        if (!e.finalized && !e.is_manual) continue;
        const existing = byDate.get(e.date);
        if (!existing || e.duration_minutes > existing.sleepMinutes) {
          byDate.set(e.date, {
            sleepMinutes: e.duration_minutes,
            awakeMinutes: e.awake_minutes,
          });
        }
      }

      const days: SleepWeekDay[] = [];
      // Walk from `from` to `anchor` to include empty days
      let current = from;
      while (current <= anchor) {
        const d = new Date(current + 'T12:00:00Z');
        const entry = byDate.get(current);
        days.push({
          date: current,
          weekday: d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
          day: d.toLocaleDateString(locale, { day: 'numeric', timeZone: 'UTC' }),
          sleepMinutes: entry?.sleepMinutes ?? 0,
          awakeMinutes: entry?.awakeMinutes ?? 0,
        });
        const next = new Date(current + 'T12:00:00Z');
        next.setUTCDate(next.getUTCDate() + 1);
        current = next.toISOString().slice(0, 10);
      }

      return days;
    },
    staleTime: 5 * 60_000,
  });
}
