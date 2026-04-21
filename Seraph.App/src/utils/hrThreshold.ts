const DEFAULT_AGE = 30;
const FTHR_FROM_MAXHR = 0.85;
const Z1_FRACTION = 0.72;

export function getEffectiveFthr(fthr: number | null, age: number | null): number {
  if (fthr != null) return fthr;
  return (220 - (age ?? DEFAULT_AGE)) * FTHR_FROM_MAXHR;
}

export function getZ1Threshold(fthr: number | null, age: number | null): number {
  return getEffectiveFthr(fthr, age) * Z1_FRACTION;
}
