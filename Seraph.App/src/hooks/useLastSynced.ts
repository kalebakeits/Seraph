import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../services/database/drizzle/repositories/dailyAggregationsRepository';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export function useLastSynced(): string | null {
  const { t } = useTranslation();
  const { data: maxTs } = useQuery({
    queryKey: ['maxAggregatedDate'],
    queryFn: () => dailyAggregationsRepository.getMaxLastAggTs(),
    refetchInterval: 60 * 1000,
  });

  if (maxTs == null) return t('time.never');

  const elapsed = Date.now() - maxTs;

  if (elapsed < FIVE_MINUTES_MS) return t('time.upToDate');
  if (elapsed < ONE_HOUR_MS) return t('time.minutesAgo', { count: Math.floor(elapsed / 60000) });
  if (elapsed < ONE_DAY_MS) return t('time.hoursAgo', { count: Math.floor(elapsed / ONE_HOUR_MS) });
  if (elapsed < SEVEN_DAYS_MS)
    return t('time.daysAgo', { count: Math.floor(elapsed / ONE_DAY_MS) });
  return new Date(maxTs).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}
