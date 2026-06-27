export interface SleepNeedFactors {
  goalMinutes: number;
  debtAdjMinutes: number;
  strainAdjMinutes: number;
  totalMinutes: number;
}

interface StoredSleepNeedFactors {
  baseMinutes?: unknown;
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
  const storedBaseMinutes = numberOrZero(stored?.baseMinutes);
  const storedTotalMinutes = numberOrZero(stored?.totalMinutes);

  return {
    goalMinutes: storedBaseMinutes > 0 ? storedBaseMinutes : goalMinutes,
    debtAdjMinutes: numberOrZero(stored?.debtAdjMinutes),
    strainAdjMinutes: numberOrZero(stored?.strainAdjMinutes),
    totalMinutes: storedTotalMinutes > 0 ? storedTotalMinutes : (sleepNeed ?? goalMinutes),
  };
}
