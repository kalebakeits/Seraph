import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dailyAggregationsRepository } from '../../services/database/drizzle';
import { todayISO, daysAgoISO } from '../../utils/dateUtils';

export type TrendMetric =
  | 'steps'
  | 'active_minutes'
  | 'hrv_rmssd'
  | 'rhr'
  | 'skin_temp'
  | 'strain'
  | 'recovery'
  | 'daily_stress';
export type TrendRange = '1W' | '1M' | '6M';

export interface TrendPoint {
  date: string; // YYYY-MM-DD (or "YYYY-Www" for weekly buckets)
  label: string; // display label for x axis
  value: number;
  weekday?: string; // 3-char weekday, 1W only
  day?: string; // numeric day, 1W only
}

export interface TrendSummary {
  avg: number | null;
  min: number | null;
  max: number | null;
  latest: number | null;
  trend: 'up' | 'down' | 'flat'; // first-half vs second-half avg
}

function rangeDays(range: TrendRange): number {
  if (range === '1W') return 6;
  if (range === '1M') return 30;
  return 182;
}

function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
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

// Groups daily rows into ISO week buckets, averaging values
function bucketByWeek(points: { date: string; value: number }[]): TrendPoint[] {
  const weeks = new Map<string, number[]>();
  const weekStart = new Map<string, string>(); // weekKey -> first date in that week

  for (const p of points) {
    const d = new Date(p.date + 'T12:00:00Z');
    // ISO week: Monday-based. Get the Monday of this week.
    const day = d.getUTCDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diff);
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
      weekStart.set(weekKey, weekKey);
    }
    weeks.get(weekKey)?.push(p.value);
  }

  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, vals]) => ({
      date: weekKey,
      label: isoWeekLabel(weekKey),
      value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    }));
}

function calcTrend(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 4) return 'flat';
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const delta = (avg2 - avg1) / avg1;
  if (delta > 0.03) return 'up';
  if (delta < -0.03) return 'down';
  return 'flat';
}

function extractValue(
  row: Awaited<ReturnType<typeof dailyAggregationsRepository.getRange>>[number],
  metric: TrendMetric,
): number | null {
  return row[metric];
}

export function useTrendData(metric: TrendMetric, range: TrendRange, anchorDate?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const anchor = anchorDate ?? todayISO();
  const from = daysAgoISO(rangeDays(range), anchor);

  return useQuery({
    queryKey: ['trend', metric, range, anchor, locale],
    queryFn: async () => {
      const rows = await dailyAggregationsRepository.getRange(from, anchor);

      const daily = rows
        .map(r => {
          const v = extractValue(r, metric);
          if (v === null) return null;
          return { date: r.date, value: Math.round(v * 10) / 10 };
        })
        .filter((p): p is { date: string; value: number } => p !== null);

      // 6M: bucket into weeks
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
          values.length > 0
            ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
            : null,
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
