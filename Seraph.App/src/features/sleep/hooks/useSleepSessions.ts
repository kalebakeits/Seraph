import { useQuery } from '@tanstack/react-query';
import { sleepEventsRepository } from '../../../services/database/drizzle';

export const useSleepSessions = (date: string) => {
  return useQuery({
    queryKey: ['sleepEvents', date],
    queryFn: () => sleepEventsRepository.getByDate(date),
    staleTime: 60_000,
  });
};
