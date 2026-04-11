import { useTrainingLoad } from './useTrainingLoad';
import { useActivityRings } from '../../home/hooks/useActivityRings';
import { todayISO } from '../../../utils/dateUtils';

const MAX_STRAIN = 21;
const MIN_STRAIN = 2;

export interface RecommendedStrainResult {
  low: number;
  high: number;
  recovery: number | null;
  hasLoad: boolean;
  currentStrain: number | null;
}

export function useRecommendedStrain(anchorDate?: string) {
  const date = anchorDate ?? todayISO();
  const { data: load } = useTrainingLoad(date);
  const { data: rings } = useActivityRings(date);

  const recovery = rings?.recovery.value != null ? Math.round(rings.recovery.value) : null;
  const currentStrain = rings?.strain.value ?? null;
  const hasLoad = load?.hasData ?? false;

  if (recovery === null) {
    return { data: { low: 0, high: 0, recovery: null, hasLoad, currentStrain }, isLoading: false };
  }

  const recoveryFraction = recovery / 100;
  let mid = recoveryFraction * MAX_STRAIN;

  if (load?.hasData) {
    const ratio = load.ratio;
    if (ratio > 1.25) mid *= 0.7;
    else if (ratio > 1.05) mid *= 0.9;
    else if (ratio < 0.8) mid = Math.max(mid, MAX_STRAIN * 0.4);
  }

  mid = Math.max(MIN_STRAIN, Math.min(MAX_STRAIN, mid));

  const low = Math.round(Math.max(MIN_STRAIN, mid * 0.8) * 10) / 10;
  const high = Math.round(Math.min(MAX_STRAIN, mid * 1.2) * 10) / 10;

  return { data: { low, high, recovery, hasLoad, currentStrain }, isLoading: false };
}
