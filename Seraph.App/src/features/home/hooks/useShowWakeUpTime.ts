import { useEffect, useState } from 'react';
import { useNextAlarm } from '../../wake-up-time/hooks/useNextAlarm';
import { getWithinWindDown } from '../../../services/alarm/windDown';

/**
 * Determines whether to show the next wake-up time on the overview tab.
 * @returns a flag indicatin whether to show the next wake-up time card on the overview tab.
 */
export const useWithinWindDown = () => {
  const [withinWindDown, setData] = useState(false);
  const { data } = useNextAlarm();
  const nextAlarmSeconds = data?.nextAlarmSeconds ?? null;

  useEffect(() => {
    void getWithinWindDown(nextAlarmSeconds).then(setData);
  }, [nextAlarmSeconds]);

  return { withinWindDown };
};
