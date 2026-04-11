export function applyTimeToDate(base: Date, picker: Date): Date {
  const result = new Date(base);
  result.setHours(picker.getHours(), picker.getMinutes(), 0, 0);
  return result;
}

export function bucketHR(
  samples: { timestamp: number; heart_rate: number }[],
  bucketMs: number,
): string {
  const buckets = new Map<number, number[]>();
  for (const s of samples) {
    if (s.heart_rate <= 0) continue;
    const b = Math.floor(s.timestamp / bucketMs);
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b)?.push(s.heart_rate);
  }
  return JSON.stringify(
    Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([b, hrs]) => ({
        t: b * bucketMs,
        hr: Math.round(hrs.reduce((a, c) => a + c, 0) / hrs.length),
      })),
  );
}
