import { useEffect, useRef, useState } from 'react';
import { activityEventsRepository } from '../../../services/database/drizzle/repositories/activityEventsRepository';
import { appParametersRepository } from '../../../services/database/drizzle/repositories/appParametersRepository';
import { reportError } from '../../../utils/reportError';
import type { ZoneSeconds } from '../../../services/database/drizzle/schema';

interface HRSample {
  t: number;
  hr: number;
}

export interface WorkoutDetailData {
  loading: boolean;
  date: string;
  startDate: Date;
  endDate: Date;
  originalStart: React.RefObject<Date>;
  originalEnd: React.RefObject<Date>;
  zoneSeconds: ZoneSeconds | null;
  hrSamples: HRSample[];
  avgHr: number | null;
  maxHr: number | null;
  thresholdHr: number | null;
  setStartDate: (d: Date) => void;
  setEndDate: (d: Date) => void;
}

export function useWorkoutDetail(activityId: number): WorkoutDetailData {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const originalStart = useRef(new Date());
  const originalEnd = useRef(new Date());
  const [zoneSeconds, setZoneSeconds] = useState<ZoneSeconds | null>(null);
  const [hrSamples, setHrSamples] = useState<HRSample[]>([]);
  const [avgHr, setAvgHr] = useState<number | null>(null);
  const [maxHr, setMaxHr] = useState<number | null>(null);
  const [thresholdHr, setThresholdHr] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const row = await activityEventsRepository.getById(activityId);
        if (row == null) return;
        setDate(row.date);
        const start = new Date(row.start_ts);
        const end = new Date(row.end_ts);
        setStartDate(start);
        setEndDate(end);
        originalStart.current = start;
        originalEnd.current = end;
        try {
          setZoneSeconds(JSON.parse(row.zone_seconds ?? 'null') as ZoneSeconds | null);
        } catch {
          setZoneSeconds(null);
        }
        try {
          setHrSamples(JSON.parse(row.hr_samples ?? '[]') as HRSample[]);
        } catch {
          setHrSamples([]);
        }
        setAvgHr(row.avg_hr ?? null);
        setMaxHr(row.max_hr ?? null);
        if (row.threshold_hr != null) {
          setThresholdHr(row.threshold_hr);
        } else {
          const profileFthr = await appParametersRepository.getNumeric('profile_threshold_hr');
          setThresholdHr(profileFthr ?? null);
        }
      } catch (e) {
        reportError(e, 'workout', 'loadWorkoutDetail');
      } finally {
        setLoading(false);
      }
    })();
  }, [activityId]);

  return {
    loading,
    date,
    startDate,
    endDate,
    originalStart,
    originalEnd,
    zoneSeconds,
    hrSamples,
    avgHr,
    maxHr,
    thresholdHr,
    setStartDate,
    setEndDate,
  };
}
