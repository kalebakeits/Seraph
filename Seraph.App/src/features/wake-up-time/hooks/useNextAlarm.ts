import { getNextAlarmSeconds } from '../../../services/alarm/nextAlarm';
import { useQuery } from '@tanstack/react-query';

// Shared query key
export const NEXT_ALARM_KEY = ['nextAlarm'];

/**
 * Hook to get the next alarm time in as Unix seconds.
 *
 * @returns Next alarm time in Unix seconds or Null if next alarm is not set.
 */
export const useNextAlarm = () => {
  return useQuery({
    queryKey: NEXT_ALARM_KEY,
    queryFn: async () => {
      return { nextAlarmSeconds: await getNextAlarmSeconds() };
    },
    refetchInterval: false,
  });
};
