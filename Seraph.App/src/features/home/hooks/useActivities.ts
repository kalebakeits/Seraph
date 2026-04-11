import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  sleepEventsRepository,
  activityEventsRepository,
} from '../../../services/database/drizzle';
import { todayISO, formatTime, formatDuration } from '../../../utils/dateUtils';
import { ActivityType } from '../../../types/ActivityType';

export interface ActivityItem {
  id: number;
  type: ActivityType;
  activityType: string; // 'Sleep', 'Run', etc.
  duration: string; // e.g. "7:08"
  startTime: string;
  endTime: string;
  start_ts: number;
  end_ts: number;
  // sleep-only
  isManual?: boolean;
  isPrimary?: boolean; // true = first wake-up of that day
  // workout-only
  avgHr?: number | null;
  maxHr?: number | null;
  trimp?: number | null;
}

export function useActivities(selectedDate?: string) {
  const date = selectedDate ?? todayISO();
  return useQuery({
    queryKey: ['activities', date],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ActivityItem[]> => {
      const [sleepEvents, activityEvents] = await Promise.all([
        sleepEventsRepository.getByDate(date),
        activityEventsRepository.getByDate(date),
      ]);

      const items: ActivityItem[] = [];

      // Mark the sleep that ends first as primary (overnight)
      const firstEndSleepId =
        sleepEvents.length > 0
          ? sleepEvents.reduce((best, s) => (s.end_ts < best.end_ts ? s : best)).id
          : null;

      for (const s of sleepEvents) {
        items.push({
          id: s.id,
          type: ActivityType.Sleep,
          activityType: s.id === firstEndSleepId ? 'activities.sleep' : 'activities.nap',
          duration: formatDuration(s.duration_minutes * 60_000),
          startTime: formatTime(s.start_ts),
          endTime: formatTime(s.end_ts),
          start_ts: s.start_ts,
          end_ts: s.end_ts,
          isManual: s.is_manual === 1,
          isPrimary: s.id === firstEndSleepId,
        });
      }

      for (const a of activityEvents) {
        items.push({
          id: a.id,
          type: ActivityType.Workout,
          activityType:
            a.type && a.type !== 'Workout' && a.type !== 'workout' ? a.type : 'activities.workout',
          duration: formatDuration(a.duration_minutes * 60_000),
          startTime: formatTime(a.start_ts),
          endTime: formatTime(a.end_ts),
          start_ts: a.start_ts,
          end_ts: a.end_ts,
          isManual: a.is_manual === 1,
          avgHr: a.avg_hr ?? null,
          maxHr: a.max_hr ?? null,
          trimp: a.trimp ?? null,
        });
      }

      items.sort((a, b) => a.start_ts - b.start_ts);
      return items;
    },
  });
}
