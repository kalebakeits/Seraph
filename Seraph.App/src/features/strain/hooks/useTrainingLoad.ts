import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import { todayISO, addDaysISO } from '../../../utils/dateUtils';

export type TrainingZone =
  | 'detraining'
  | 'recovery'
  | 'maintaining'
  | 'productive'
  | 'overreaching'
  | 'overtraining';

export interface TrainingLoadPoint {
  date: string;
  label: string;
  ctl: number;
  atl: number;
  ratio: number;
}

export interface TrainingLoadResult {
  atl: number;
  ctl: number;
  tsb: number;
  ratio: number;
  zone: TrainingZone;
  hasData: boolean;
  history: TrainingLoadPoint[];
}

const CTL_DECAY = 41 / 42;
const ATL_DECAY = 6 / 7;

function classifyZone(ratio: number): TrainingZone {
  if (ratio < 0.8) return 'detraining';
  if (ratio < 1.0) return 'recovery';
  if (ratio < 1.05) return 'maintaining';
  if (ratio < 1.25) return 'productive';
  if (ratio < 1.5) return 'overreaching';
  return 'overtraining';
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T12:00:00Z').getTime() - new Date(a + 'T12:00:00Z').getTime()) / 86_400_000,
  );
}

function decay(ctl: number, atl: number, days: number) {
  return { ctl: ctl * Math.pow(CTL_DECAY, days), atl: atl * Math.pow(ATL_DECAY, days) };
}

const EMPTY: TrainingLoadResult = {
  atl: 0,
  ctl: 0,
  tsb: 0,
  ratio: 1,
  zone: 'maintaining',
  hasData: false,
  history: [],
};

async function fetchTrainingLoad(today: string, locale: string): Promise<TrainingLoadResult> {
  const lastRow = await dailyAggregationsRepository.getLatestWithLoad(today);
  if (!lastRow?.ctl || !lastRow.atl) return EMPTY;

  const gapDays = daysBetween(lastRow.date, today);
  const { ctl, atl } =
    gapDays > 0 ? decay(lastRow.ctl, lastRow.atl, gapDays) : { ctl: lastRow.ctl, atl: lastRow.atl };
  const tsb = ctl - atl;
  const ratio = ctl > 0 ? atl / ctl : 1;

  const historyStart = addDaysISO(today, -6);
  const [dbRows, anchorRow] = await Promise.all([
    dailyAggregationsRepository.getRange(historyStart, today),
    dailyAggregationsRepository.getLatestWithLoadBefore(historyStart),
  ]);

  const rowMap = new Map(dbRows.map(r => [r.date, r]));
  let lastCtl = anchorRow?.ctl ?? 0;
  let lastAtl = anchorRow?.atl ?? 0;
  let lastDate = anchorRow?.date ?? addDaysISO(historyStart, -1);

  const history: TrainingLoadPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(historyStart, i);
    const row = rowMap.get(date);
    if (row?.ctl != null && row.atl != null) {
      lastCtl = row.ctl;
      lastAtl = row.atl;
    } else {
      const d = decay(lastCtl, lastAtl, daysBetween(lastDate, date));
      lastCtl = d.ctl;
      lastAtl = d.atl;
    }
    lastDate = date;
    const d = new Date(date + 'T12:00:00Z');
    const label = d.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
    history.push({
      date,
      label,
      ctl: Math.round(lastCtl),
      atl: Math.round(lastAtl),
      ratio: lastCtl > 0 ? lastAtl / lastCtl : 1,
    });
  }

  return {
    atl: Math.round(atl),
    ctl: Math.round(ctl),
    tsb: Math.round(tsb),
    ratio,
    zone: classifyZone(ratio),
    hasData: true,
    history,
  };
}

export function useTrainingLoad(anchorDate?: string) {
  const today = anchorDate ?? todayISO();
  const { i18n } = useTranslation();
  const locale = i18n.language;
  return useQuery({
    queryKey: ['trainingLoad', today, locale],
    queryFn: () => fetchTrainingLoad(today, locale),
    placeholderData: EMPTY,
    staleTime: 0,
  });
}
