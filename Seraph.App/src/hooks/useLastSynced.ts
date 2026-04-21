import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../services/database/drizzle/repositories/dailyAggregationsRepository';
import { seraphEmitter, type SyncStatus } from '../services/ble/nativeModule';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
const ONE_MINUTE_MS = 60 * 1000;

const QUERY_KEY = ['maxAggregatedDate'] as const;

type Bucket =
  | { kind: 'never' }
  | { kind: 'upToDate' }
  | { kind: 'minutes'; count: number }
  | { kind: 'hours'; count: number }
  | { kind: 'days'; count: number }
  | { kind: 'absolute'; ts: number };

async function computeBucket(): Promise<Bucket> {
  const ts = await dailyAggregationsRepository.getMaxLastAggTs();
  if (ts == null) return { kind: 'never' };
  const elapsed = Date.now() - ts;
  if (elapsed < FIVE_MINUTES_MS) return { kind: 'upToDate' };
  if (elapsed < ONE_HOUR_MS) return { kind: 'minutes', count: Math.floor(elapsed / 60000) };
  if (elapsed < ONE_DAY_MS) return { kind: 'hours', count: Math.floor(elapsed / ONE_HOUR_MS) };
  if (elapsed < SEVEN_DAYS_MS) return { kind: 'days', count: Math.floor(elapsed / ONE_DAY_MS) };
  return { kind: 'absolute', ts };
}

function refetchMsFor(bucket: Bucket | undefined): number | false {
  if (!bucket) return ONE_MINUTE_MS;
  switch (bucket.kind) {
    case 'minutes':
    case 'upToDate':
      return ONE_MINUTE_MS;
    case 'hours':
      return ONE_HOUR_MS;
    case 'days':
    case 'absolute':
    case 'never':
      return false;
  }
}

export function useLastSynced(): string | null {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: bucket } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: computeBucket,
    refetchInterval: q => refetchMsFor(q.state.data),
  });

  useEffect(() => {
    const sub = seraphEmitter.addListener('onSyncStateChange', (event: SyncStatus) => {
      if (event.status === 'aggregating' || event.status === 'complete') {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    });
    return () => {
      sub.remove();
    };
  }, [queryClient]);

  if (!bucket) return null;
  switch (bucket.kind) {
    case 'never':
      return t('time.never');
    case 'upToDate':
      return t('time.upToDate');
    case 'minutes':
      return t('time.minutesAgo', { count: bucket.count });
    case 'hours':
      return t('time.hoursAgo', { count: bucket.count });
    case 'days':
      return t('time.daysAgo', { count: bucket.count });
    case 'absolute':
      return new Date(bucket.ts).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      });
  }
}
