import { useQuery } from '@tanstack/react-query';
import { sleepEventsRepository } from '../../../services/database/drizzle';
import { todayISO, tsToDecimalHour } from '../../../utils/dateUtils';

export interface SleepNight {
  day: string; // e.g. "Mon"
  bedtimeHour: number; // decimal, normalised to 18–30 range
  wakeHour: number; // decimal 0–24
  durationMin: number;
}

export interface SleepConsistencyData {
  nights: SleepNight[];
  bedtime: { earliest: number; avg: number; latest: number };
  wake: { earliest: number; avg: number; latest: number };
  avgDurationMin: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useSleepConsistency(anchorDate?: string) {
  const anchor = anchorDate ?? todayISO();
  return useQuery({
    queryKey: ['sleepConsistency', anchor],
    queryFn: async (): Promise<SleepConsistencyData | null> => {
      const today = new Date(anchor + 'T12:00:00Z');
      const fetches = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - (6 - i));
        return sleepEventsRepository
          .getFirstForDate(d.toISOString().slice(0, 10))
          .then(sleep => ({ sleep, day: DAY_LABELS[d.getUTCDay()] }));
      });

      const results = await Promise.all(fetches);
      const valid = results.filter(r => r.sleep !== null) as {
        sleep: NonNullable<Awaited<ReturnType<typeof sleepEventsRepository.getFirstForDate>>>;
        day: string;
      }[];

      if (valid.length < 2) return null;

      const nights: SleepNight[] = valid.map(({ sleep, day }) => {
        const bedHour = tsToDecimalHour(sleep.start_ts, true);
        const wakeHour = tsToDecimalHour(sleep.end_ts);

        return { day, bedtimeHour: bedHour, wakeHour, durationMin: sleep.duration_minutes };
      });

      const bedHours = nights.map(n => n.bedtimeHour);
      const wakeHours = nights.map(n => n.wakeHour);
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

      return {
        nights,
        bedtime: {
          earliest: Math.min(...bedHours),
          avg: avg(bedHours),
          latest: Math.max(...bedHours),
        },
        wake: {
          earliest: Math.min(...wakeHours),
          avg: avg(wakeHours),
          latest: Math.max(...wakeHours),
        },
        avgDurationMin: Math.round(nights.reduce((s, n) => s + n.durationMin, 0) / nights.length),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
