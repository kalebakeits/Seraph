import { useQuery } from '@tanstack/react-query';
import { getAlarmTriggerForNextSleepInterval } from '../../../services/alarm/nextAlarm';

export const ALARM_TRIGGER_FOR_NEXT_SLEEP_INTERVAL_KEY = ['alarmTriggerForNextSleepInterval'];

export const useAlarmTriggerForNextSleepInterval = () => {
  return useQuery({
    queryKey: ALARM_TRIGGER_FOR_NEXT_SLEEP_INTERVAL_KEY,
    queryFn: getAlarmTriggerForNextSleepInterval,
  });
};
