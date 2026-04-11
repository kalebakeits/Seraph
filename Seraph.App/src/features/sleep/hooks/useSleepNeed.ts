import { useSleepNeedFactors } from '../../wake-up-time/hooks/useSleepNeedFactors';

const DEFAULT_SLEEP_NEED = 480;

export const useSleepNeedMinutes = (): number => {
  const { data } = useSleepNeedFactors();
  return data?.totalMinutes ?? DEFAULT_SLEEP_NEED;
};
