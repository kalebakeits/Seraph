import { useQuery } from '@tanstack/react-query';
import { activityEventsRepository } from '../../../services/database/drizzle';
import { todayISO, formatTime, formatDuration } from '../../../utils/dateUtils';
import { ActivityType } from '../../../types/ActivityType';
import type { ActivityItem } from '../../home/hooks/useActivities';

export function useStrainWorkouts(date?: string) {
  const targetDate = date ?? todayISO();

  return useQuery<ActivityItem[]>({
    queryKey: ['strainWorkouts', targetDate],
    queryFn: async () => {
      const events = await activityEventsRepository.getByDate(targetDate);
      return events.map(a => ({
        id: a.id,
        type: ActivityType.Workout,
        activityType:
          a.type && a.type !== 'Workout' && a.type !== 'workout' && a.type !== 'unknown'
            ? a.type
            : 'activities.workout',
        duration: formatDuration(a.duration_minutes * 60_000),
        startTime: formatTime(a.start_ts),
        endTime: formatTime(a.end_ts),
        start_ts: a.start_ts,
        end_ts: a.end_ts,
        isManual: a.is_manual === 1,
        avgHr: a.avg_hr ?? null,
        maxHr: a.max_hr ?? null,
        trimp: a.trimp ?? null,
      }));
    },
    staleTime: 0,
  });
}
