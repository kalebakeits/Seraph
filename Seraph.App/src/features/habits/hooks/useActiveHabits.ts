import { useQuery } from '@tanstack/react-query';
import { habitDefinitionsRepository } from '../../../services/database/drizzle';

export function useActiveHabits() {
  return useQuery({
    queryKey: ['habits', 'active'],
    queryFn: () => habitDefinitionsRepository.getActive(),
  });
}
