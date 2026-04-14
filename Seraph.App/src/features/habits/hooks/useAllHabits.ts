import { useQuery } from '@tanstack/react-query';
import { habitDefinitionsRepository } from '../../../services/database/drizzle';

export function useAllHabits() {
  return useQuery({
    queryKey: ['habits', 'all'],
    queryFn: () => habitDefinitionsRepository.getAll(),
  });
}
