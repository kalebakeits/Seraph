import { useQuery } from '@tanstack/react-query';
import { sleepEventsRepository } from '../../../services/database/drizzle';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { todayISO, formatTime, formatDuration } from '../../../utils/dateUtils';

export interface SleepStageSegment {
  stage: 'light' | 'deep' | 'rem' | 'awake';
  startMin: number;
  endMin: number;
  duration: number;
}

export interface RecentSleepData {
  id: number;
  date: string;
  bedtime: string;
  wakeTime: string;
  totalSleep: number; // hours
  totalSleepFormatted: string; // e.g. "7h 23m"
  timeline: SleepStageSegment[];
  quality: number;
  avgHr: number | null;
  hrv: number | null;
  rhr: number | null;
  awakeMinutes: number;
  start_ts: number;
  end_ts: number;
  sleep_edited: number;
}

export function useRecentSleep(selectedDate?: string) {
  const date = selectedDate ?? todayISO();
  return useQuery({
    queryKey: ['recentSleep', date],
    queryFn: async (): Promise<RecentSleepData | null> => {
      const sleep = await sleepEventsRepository.getFirstForDate(date);
      if (!sleep) return null;

      const agg = await dailyAggregationsRepository.getByDate(date);
      const durationMin = sleep.duration_minutes;

      const timeline: SleepStageSegment[] = [
        {
          stage: 'light',
          startMin: 0,
          endMin: durationMin,
          duration: durationMin,
        },
      ];

      const quality =
        sleep.sleep_score ??
        (sleep.hrv_rmssd
          ? Math.round(Math.min(100, (sleep.hrv_rmssd / 80) * 100))
          : Math.round(Math.min(100, (durationMin / 480) * 100)));

      return {
        id: sleep.id,
        date: new Date(sleep.start_ts).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        bedtime: formatTime(sleep.start_ts),
        wakeTime: formatTime(sleep.end_ts),
        totalSleep: Math.round((durationMin / 60) * 10) / 10,
        totalSleepFormatted: formatDuration(durationMin * 60_000),
        timeline,
        quality,
        avgHr: sleep.avg_hr ?? null,
        hrv: sleep.hrv_rmssd !== null ? Math.round(sleep.hrv_rmssd) : null,
        rhr: agg?.rhr != null ? Math.round(agg.rhr) : null,
        awakeMinutes: sleep.awake_minutes,
        start_ts: sleep.start_ts,
        end_ts: sleep.end_ts,
        sleep_edited: sleep.sleep_edited,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
