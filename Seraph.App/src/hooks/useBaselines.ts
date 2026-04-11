import { useQuery } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../services/database/drizzle/repositories/dailyAggregationsRepository';

export function useBaselines() {
  return useQuery({
    queryKey: ['latestBaselines'],
    queryFn: () => dailyAggregationsRepository.getLatestWithBaselines(),
  });
}
