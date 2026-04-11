import { useQuery } from '@tanstack/react-query';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { todayISO } from '../../../utils/dateUtils';

export interface RecoveryFactor {
  key: 'hrv' | 'rhr' | 'sleep';
  value: number | null;
  baseline: number | null;
  direction: 'up' | 'down' | 'flat' | null;
  favorable: boolean | null;
}

export interface RecoveryFactorsData {
  score: number | null;
  factors: RecoveryFactor[];
}

export function useRecoveryFactors(selectedDate?: string) {
  const date = selectedDate ?? todayISO();

  return useQuery({
    queryKey: ['recovery-factors', date],
    queryFn: async (): Promise<RecoveryFactorsData> => {
      const [agg, sleep] = await Promise.all([
        dailyAggregationsRepository.getByDate(date),
        sleepEventsRepository.getFirstForDate(date),
      ]);

      const hrv = agg?.hrv_rmssd ?? null;
      const rhr = agg?.rhr ?? null;
      const sleepMin = sleep?.duration_minutes ?? null;
      const sleepNeed = agg?.sleep_need ?? null;
      // Baselines snapshotted on this date — accurate for historical views
      const bHrv = agg?.baseline_hrv ?? null;
      const bRhr = agg?.baseline_rhr ?? null;

      function computeFactorDirection(
        value: number | null,
        baseline: number | null,
      ): 'up' | 'down' | 'flat' | null {
        if (value === null || baseline === null) return null;
        if (value > baseline * 1.02) return 'up';
        if (value < baseline * 0.98) return 'down';
        return 'flat';
      }

      function computeFavorable(
        value: number | null,
        baseline: number | null,
        betterHigh = true,
      ): boolean | null {
        if (value === null || baseline === null) return null;
        return betterHigh ? value >= baseline * 0.98 : value <= baseline * 1.02;
      }

      const factors: RecoveryFactor[] = [
        {
          key: 'hrv',
          value: hrv !== null ? Math.round(hrv) : null,
          baseline: bHrv !== null ? Math.round(bHrv) : null,
          direction: computeFactorDirection(hrv, bHrv),
          favorable: computeFavorable(hrv, bHrv, true),
        },
        {
          key: 'rhr',
          value: rhr !== null ? Math.round(rhr) : null,
          baseline: bRhr !== null ? Math.round(bRhr) : null,
          direction: computeFactorDirection(rhr, bRhr),
          favorable: computeFavorable(rhr, bRhr, false),
        },
        {
          key: 'sleep',
          value: sleepMin,
          baseline: sleepNeed !== null ? Math.round(sleepNeed) : null,
          direction: computeFactorDirection(sleepMin, sleepNeed),
          favorable: computeFavorable(sleepMin, sleepNeed, true),
        },
      ];

      return {
        score: agg?.recovery != null ? Math.round(agg.recovery) : null,
        factors,
      };
    },
    staleTime: 0,
  });
}
