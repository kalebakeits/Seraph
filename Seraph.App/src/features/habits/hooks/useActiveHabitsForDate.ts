import { useQuery } from '@tanstack/react-query';
import { habitDefinitionsRepository } from '../../../services/database/drizzle';

export function useActiveHabitsForDate(date: string) {
  return useQuery({
    queryKey: ['habits', 'activeForDate', date],
    queryFn: () => habitDefinitionsRepository.getActiveForDate(date),
  });
}
