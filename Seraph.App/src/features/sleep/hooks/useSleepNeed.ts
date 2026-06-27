import { useSleepNeedFactors } from '../../wake-up-time/hooks/useSleepNeedFactors';

export const useSleepNeedMinutes = (date: string): number | null => {
  const { data } = useSleepNeedFactors(date);
  return data?.totalMinutes ?? null;
};
