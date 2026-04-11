import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AlarmMode } from '../../../services/database/userPreferences/alarmPreferences';
import {
  getAlarmTime,
  getAlarmMode,
  getAlarmSchedule,
  setAlarmTime,
  setAlarmMode,
  setAlarmSchedule,
} from '../../../services/database/userPreferences/alarmPreferences';
import { NEXT_ALARM_KEY } from './useNextAlarm';

// Shared query key
export const ALARM_PREFERENCES_KEY = ['alarmPreferences'];

// Shared query function
export const fetchAlarmPreferences = async () => {
  const alarmTime = await getAlarmTime();
  const alarmMode = await getAlarmMode();
  const alarmSchedule = await getAlarmSchedule();
  return {
    alarmTime: alarmTime ?? '07:00',
    alarmMode,
    alarmSchedule,
  };
};

export const useAlarmPreferences = () => {
  const queryClient = useQueryClient();

  // Load all alarm preferences
  const { data, isLoading } = useQuery({
    queryKey: ALARM_PREFERENCES_KEY,
    queryFn: fetchAlarmPreferences,
  });

  // Mutation to update alarm time
  const updateTimeMutation = useMutation({
    mutationFn: async (time: string) => {
      await setAlarmTime(time);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALARM_PREFERENCES_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_ALARM_KEY });
    },
  });

  // Mutation to update alarm mode
  const updateModeMutation = useMutation({
    mutationFn: async (mode: AlarmMode) => {
      await setAlarmMode(mode);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALARM_PREFERENCES_KEY });
    },
  });

  // Mutation to update schedule
  const updateScheduleMutation = useMutation({
    mutationFn: async (schedule: number[]) => {
      await setAlarmSchedule(schedule);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALARM_PREFERENCES_KEY });
    },
  });

  return {
    alarmTime: data?.alarmTime ?? '07:00',
    alarmMode: data?.alarmMode ?? 'disabled',
    alarmSchedule: data?.alarmSchedule ?? [1, 1, 1, 1, 1, 1, 1],
    isLoading,
    updateTime: updateTimeMutation.mutate,
    updateMode: updateModeMutation.mutate,
    updateSchedule: updateScheduleMutation.mutate,
  };
};
