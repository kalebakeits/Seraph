import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sleepEventsRepository } from '../../../services/database/drizzle';
import { todayISO, daysAgoISO } from '../../../utils/dateUtils';
import type { TrendPoint, TrendSummary, TrendRange } from '../useTrendData';

function rangeDays(range: TrendRange): number {
  if (range === '1W') return 6;
  if (range === '1M') return 30;
  return 182;
}

function dayLabel(dateStr: string, range: TrendRange, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  if (range === '1W') return d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function weekdayDay(dateStr: string, locale: string): { weekday: string; day: string } {
  const d = new Date(dateStr + 'T12:00:00Z');
  return {
    weekday: d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
    day: d.toLocaleDateString(locale, { day: 'numeric', timeZone: 'UTC' }),
  };
}

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function bucketByWeek(points: { date: string; value: number }[]): TrendPoint[] {
  const weeks = new Map<string, number[]>();
  for (const p of points) {
    const key = mondayOf(p.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)?.push(p.value);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({
      date: key,
      label: isoWeekLabel(key),
      value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
}

function calcTrend(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 4) return 'flat';
  const mid = Math.floor(values.length / 2);
  const avg1 = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const avg2 = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
  const delta = (avg2 - avg1) / avg1;
  if (delta > 0.03) return 'up';
  if (delta < -0.03) return 'down';
  return 'flat';
}

export function useSleepAwakeTrend(range: TrendRange, anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const anchor = anchorDate ?? todayISO();
  const from = daysAgoISO(rangeDays(range), anchor);

  return useQuery({
    queryKey: ['sleepAwakeTrend', range, anchor, locale],
    queryFn: async () => {
      const events = await sleepEventsRepository.getRange(from);

      // Pick primary (longest) sleep per date, use its awake_minutes
      const byDate = new Map<string, { awake: number; duration: number }>();
      for (const e of events) {
        if (e.date < from || e.date > anchor) continue;
        if (!e.finalized && !e.is_manual) continue;
        const existing = byDate.get(e.date);
        if (!existing || e.duration_minutes > existing.duration) {
          byDate.set(e.date, { awake: e.awake_minutes, duration: e.duration_minutes });
        }
      }

      const daily = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, value: v.awake }));

      const points: TrendPoint[] =
        range === '6M'
          ? bucketByWeek(daily)
          : daily.map(p => {
              const label = dayLabel(p.date, range, locale);
              if (range === '1W') {
                const { weekday, day } = weekdayDay(p.date, locale);
                return { ...p, label, weekday, day };
              }
              return { ...p, label };
            });

      const values = points.map(p => p.value);
      const summary: TrendSummary = {
        avg:
          values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null,
        min: values.length > 0 ? Math.min(...values) : null,
        max: values.length > 0 ? Math.max(...values) : null,
        latest: points.length > 0 ? points[points.length - 1].value : null,
        trend: calcTrend(values),
      };

      return { points, summary };
    },
    staleTime: 5 * 60 * 1000,
  });
}
