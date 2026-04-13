export const GRANULARITY_OPTIONS = [1, 2, 5, 10] as const;
export type GranularitySeconds = typeof GRANULARITY_OPTIONS[number];

export const ROWS_PER_DAY: Record<GranularitySeconds, number> = {
  1: 86_400,
  2: 43_200,
  5: 17_280,
  10: 8_640,
};

// ~9.3 MB/day measured at 1s granularity (89,600 rows/day, ~109 bytes/row in SQLite)
const MB_PER_DAY_AT_1S = 9.3;

export function estimatedMbPerDay(granularity: GranularitySeconds): number {
  return MB_PER_DAY_AT_1S / granularity;
}
