import { useQuery } from '@tanstack/react-query';
import { habitLogsRepository } from '../../../services/database/drizzle';

export function useHabitLogs(date: string) {
  return useQuery({
    queryKey: ['habitLogs', date],
    queryFn: () => habitLogsRepository.getForDate(date),
  });
}
