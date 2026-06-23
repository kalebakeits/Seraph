import { useQuery } from '@tanstack/react-query';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import type { SleepEvent } from '../../../services/database/drizzle/schema';
import type { HRChartPoint } from '../../../components/common/SkiaHRChart';

interface AwakeRun {
  from: number;
  to: number;
}

export interface SleepSessionDetail {
  session: SleepEvent;
  hrPoints: HRChartPoint[];
  awakeRuns: AwakeRun[];
  isPrimary: boolean;
  rhr: number | null;
  quality: number | null;
}

async function fetchSleepSessionDetail(sleepId: number): Promise<SleepSessionDetail> {
  const session = await sleepEventsRepository.getByID(sleepId);
  if (!session) throw new Error(`Sleep event ${String(sleepId)} not found`);

  let hrPoints: HRChartPoint[] = [];
  if (session.hr_samples) {
    try {
      hrPoints = (JSON.parse(session.hr_samples) as { t: number; hr: number }[]).map(p => ({
        t: p.t,
        hr: p.hr,
      }));
    } catch {
      hrPoints = [];
    }
  }

  // stage_samples s=0 runs are awake windows to overlay on the HR chart
  let awakeRuns: AwakeRun[] = [];
  if (session.stage_samples) {
    try {
      const runs = JSON.parse(session.stage_samples) as { s: number; from: number; to: number }[];
      awakeRuns = runs.filter(r => r.s === 0).map(r => ({ from: r.from, to: r.to }));
    } catch {
      awakeRuns = [];
    }
  }

  const wakeDate = new Date(session.end_ts);
  const dayStart = new Date(wakeDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(wakeDate);
  dayEnd.setHours(23, 59, 59, 999);

  const [sameDaySessions, agg] = await Promise.all([
    sleepEventsRepository.getByEndTsRange(dayStart.getTime(), dayEnd.getTime()),
    dailyAggregationsRepository.getByDate(session.date),
  ]);

  const minEndTs = Math.min(...sameDaySessions.map(s => s.end_ts));
  const isPrimary = session.end_ts === minEndTs;

  const rhr = agg?.rhr != null ? Math.round(agg.rhr) : null;
  const primarySleepQuality =
    session.sleep_score ??
    (session.hrv_rmssd
      ? Math.round(Math.min(100, (session.hrv_rmssd / 80) * 100))
      : Math.round(Math.min(100, (session.duration_minutes / 480) * 100)));
  const quality = isPrimary ? primarySleepQuality : null;

  return { session, hrPoints, awakeRuns, isPrimary, rhr, quality };
}

export const useSleepSessionDetail = (sleepId: number) =>
  useQuery({
    queryKey: ['sleepSessionDetail', sleepId],
    queryFn: () => fetchSleepSessionDetail(sleepId),
    staleTime: 30_000,
  });
