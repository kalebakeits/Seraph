import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AlarmMode } from '../../../services/database/userPreferences/alarmPreferences';
import {
  getAlarmTime,
  getAlarmMode,
  getAlarmSchedule,
  setAlarmSingleTs,
  setAlarmTime,
  setAlarmMode,
  setAlarmSchedule,
} from '../../../services/database/userPreferences/alarmPreferences';
import { NEXT_ALARM_KEY } from './useNextAlarm';
import { ALARM_TRIGGER_FOR_NEXT_SLEEP_INTERVAL_KEY } from './useAlarmTriggerForNextSleepInterval';
import { calculateNextOccurrenceSeconds } from '../../../utils/alarmUtils';

export const ALARM_PREFERENCES_KEY = ['alarmPreferences'];

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

  const { data, isLoading } = useQuery({
    queryKey: ALARM_PREFERENCES_KEY,
    queryFn: fetchAlarmPreferences,
  });

  const savePreferences = async (time: string, mode: AlarmMode, schedule: number[]) => {
    await Promise.all([setAlarmTime(time), setAlarmMode(mode), setAlarmSchedule(schedule)]);
    if (mode === 'single') {
      await setAlarmSingleTs(calculateNextOccurrenceSeconds(time));
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ALARM_PREFERENCES_KEY }),
      queryClient.invalidateQueries({ queryKey: NEXT_ALARM_KEY }),
      queryClient.invalidateQueries({ queryKey: ALARM_TRIGGER_FOR_NEXT_SLEEP_INTERVAL_KEY }),
    ]);
  };

  return {
    alarmTime: data?.alarmTime ?? '07:00',
    alarmMode: data?.alarmMode ?? 'disabled',
    alarmSchedule: data?.alarmSchedule ?? [1, 1, 1, 1, 1, 1, 1],
    isLoading,
    savePreferences,
  };
};
