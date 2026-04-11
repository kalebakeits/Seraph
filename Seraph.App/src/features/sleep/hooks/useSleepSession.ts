import { useQuery } from '@tanstack/react-query';
import { sleepEventsRepository } from '../../../services/database/drizzle';

export const useSleepSession = (id: number) => {
  return useQuery({
    queryKey: ['sleepEvent', id],
    queryFn: () => sleepEventsRepository.getByID(id),
    staleTime: 60_000,
  });
};
