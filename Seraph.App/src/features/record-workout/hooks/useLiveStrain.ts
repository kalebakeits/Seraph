import { useEffect, useRef, useState } from 'react';
import { dailyAggregationsRepository } from '../../../services/database/drizzle';
import { todayISO } from '../../../utils/dateUtils';

const POLL_INTERVAL_MS = 5000;
const STRAIN_GOAL = 21;

export interface LiveStrainState {
  baseStrain: number | null; // strain already in DB for today before this workout
  liveContribution: number; // trimp-derived estimate from recording so far (approx)
  total: number | null; // baseStrain + liveContribution, capped at 21
}

// Very rough strain from elapsed minutes and average HR zone
// This is just for the display ring — accurate value comes from reaggregation on stop
function estimateStrainContribution(elapsedMs: number, avgHrRatio: number): number {
  const minutes = elapsedMs / 60000;
  // Simplified TRIMP → strain approximation
  const trimp = minutes * avgHrRatio * 0.64 * Math.exp(1.92 * avgHrRatio);
  // Approximate strain from trimp (rough: strain ≈ trimp * 0.35, empirically)
  return trimp * 0.35;
}

export function useLiveStrain(
  isRecording: boolean,
  elapsedMs: number,
  currentHrZone: 1 | 2 | 3 | 4 | 5 | null,
): LiveStrainState {
  const [baseStrain, setBaseStrain] = useState<number | null>(null);
  const [liveContribution, setLiveContribution] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load base strain once on mount
  useEffect(() => {
    void dailyAggregationsRepository.getByDate(todayISO()).then(agg => {
      setBaseStrain(agg?.strain ?? null);
    });
  }, []);

  // Poll native for elapsedMs and update contribution
  useEffect(() => {
    if (!isRecording) {
      setLiveContribution(0);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(() => {
      // Use zone midpoint as hrRatio estimate (Z1=0.2, Z2=0.4, Z3=0.6, Z4=0.8, Z5=0.95)
      const zoneRatios: Record<number, number> = { 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 0.95 };
      const hrRatio = currentHrZone !== null ? zoneRatios[currentHrZone] : 0.5;
      const contrib = estimateStrainContribution(elapsedMs, hrRatio);
      setLiveContribution(contrib);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isRecording, elapsedMs, currentHrZone]);

  let total: number | null = null;

  if (baseStrain !== null) {
    total = Math.min(baseStrain + liveContribution, STRAIN_GOAL);
  } else if (liveContribution > 0) {
    total = Math.min(liveContribution, STRAIN_GOAL);
  } else {
    total = null;
  }

  return { baseStrain, liveContribution, total };
}
