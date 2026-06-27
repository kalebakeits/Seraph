import { useQuery } from '@tanstack/react-query';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { todayISO } from '../../../utils/dateUtils';

export function useCurrentSleepDate(): string {
  const { data } = useQuery({
    queryKey: ['currentSleepDate'],
    queryFn: () => sleepEventsRepository.getLastMainSleep(),
    staleTime: 5 * 60 * 1000,
  });
  return data?.date ?? todayISO();
}
