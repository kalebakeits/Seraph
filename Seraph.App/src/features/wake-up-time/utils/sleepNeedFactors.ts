export interface SleepNeedFactors {
  goalMinutes: number;
  debtAdjMinutes: number;
  strainAdjMinutes: number;
  totalMinutes: number;
}

interface StoredSleepNeedFactors {
  debtAdjMinutes?: unknown;
  strainAdjMinutes?: unknown;
  totalMinutes?: unknown;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseStoredFactors(value: string | null): StoredSleepNeedFactors | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as StoredSleepNeedFactors;
  } catch {
    return null;
  }
}

export function buildSleepNeedFactors(
  goalMinutes: number,
  sleepNeed: number | null,
  sleepNeedFactors: string | null,
): SleepNeedFactors {
  const stored = parseStoredFactors(sleepNeedFactors);
  const debtAdjMinutes = numberOrZero(stored?.debtAdjMinutes);
  const strainAdjMinutes = numberOrZero(stored?.strainAdjMinutes);
  const storedTotalMinutes = numberOrZero(stored?.totalMinutes);
  const totalMinutes = storedTotalMinutes > 0 ? storedTotalMinutes : (sleepNeed ?? goalMinutes);

  return {
    goalMinutes,
    debtAdjMinutes,
    strainAdjMinutes,
    totalMinutes,
  };
}
