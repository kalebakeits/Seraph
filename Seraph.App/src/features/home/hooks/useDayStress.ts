import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  dailyAggregationsRepository,
  sleepEventsRepository,
  activityEventsRepository,
} from '../../../services/database/drizzle';
import { todayISO } from '../../../utils/dateUtils';
import { ActivityType } from '../../../types/ActivityType';

const WINDOW_MS = 5 * 60 * 1000;

export interface HRVWindow {
  t: number;
  v: number | null;
}

export interface StressOverlay {
  startSlot: number;
  endSlot: number;
  type: ActivityType;
}

export interface DayStressResult {
  windows: HRVWindow[];
  overlays: StressOverlay[];
  dailyStress: number | null;
  baseline: number | null;
}

const EMPTY: DayStressResult = { windows: [], overlays: [], dailyStress: null, baseline: null };

function tsToSlot(ts: number, dayStartMs: number): number {
  return Math.floor((ts - dayStartMs) / WINDOW_MS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function useDayStress(selectedDate?: string) {
  const date = selectedDate ?? todayISO();

  return useQuery({
    queryKey: ['dayStress', date],
    queryFn: async (): Promise<DayStressResult> => {
      const agg = await dailyAggregationsRepository.getByDate(date);
      if (!agg?.hrv_windows) return EMPTY;

      const windows = JSON.parse(agg.hrv_windows) as HRVWindow[];
      if (windows.length === 0) return EMPTY;

      const dayStartMs = windows[0].t;
      const dayEndMs = dayStartMs + 86_400_000;

      const [sleepEvents, activityEvents] = await Promise.all([
        sleepEventsRepository.getByDate(date),
        activityEventsRepository.getByDate(date),
      ]);

      const overlays: StressOverlay[] = [];

      // Determine primary sleep (earliest end_ts = overnight)
      const primarySleepId =
        sleepEvents.length > 0
          ? sleepEvents.reduce((best, s) => (s.end_ts < best.end_ts ? s : best)).id
          : null;

      for (const s of sleepEvents) {
        const startSlot = clamp(tsToSlot(Math.max(s.start_ts, dayStartMs), dayStartMs), 0, 287);
        const endSlot = clamp(tsToSlot(Math.min(s.end_ts, dayEndMs), dayStartMs), 0, 287);
        overlays.push({
          startSlot,
          endSlot,
          type: s.id === primarySleepId ? ActivityType.Sleep : ActivityType.Nap,
        });
      }

      for (const a of activityEvents) {
        const startSlot = clamp(tsToSlot(Math.max(a.start_ts, dayStartMs), dayStartMs), 0, 287);
        const endSlot = clamp(tsToSlot(Math.min(a.end_ts, dayEndMs), dayStartMs), 0, 287);
        overlays.push({ startSlot, endSlot, type: ActivityType.Workout });
      }

      return {
        windows,
        overlays,
        dailyStress: agg.daily_stress ?? null,
        baseline: agg.baseline_waking_hrv ?? null,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
