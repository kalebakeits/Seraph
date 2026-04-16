/** Formats a timestamp as a locale-aware time string (e.g. "9:41 AM"). */
export function formatTime(ts: number, locale?: string): string {
  return new Date(ts).toLocaleTimeString(locale ?? undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Adds N days to an ISO date string. Negative N goes backwards. */
export function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Formats minutes into a compact "Xh Ym" string.
 * Returns '0m' for values under 1 minute.
 */
export function formatMinutes(min: number): string {
  if (min < 1) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${String(h)}h ${String(m)}m` : `${String(m)}m`;
}

/**
 * Converts a timestamp to a decimal hour (0-24+).
 * If normaliseBedtime is true, hours before 18:00 are shifted +24
 * so bedtimes past midnight sort correctly in the 18-30 range.
 */
export function tsToDecimalHour(ts: number, normaliseBedtime = false): number {
  const d = new Date(ts);
  const h = d.getHours() + d.getMinutes() / 60;
  return normaliseBedtime && h < 18 ? h + 24 : h;
}

/**
 * Formats a decimal hour (e.g. 22.5) as a locale-aware time string.
 * Handles values > 24 by wrapping (mod 24).
 */
export function formatDecimalHour(decimalHour: number, locale?: string): string {
  const d = new Date();
  d.setHours(Math.floor(decimalHour) % 24, Math.round((decimalHour % 1) * 60), 0, 0);
  return d.toLocaleTimeString(locale ?? undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Formats an ISO date string as a short weekday + date (e.g. "Mon, Mar 31"). */
export function formatShortDate(iso: string, locale?: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString(locale ?? undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Converts minutes-since-midnight to a Date for use with time pickers.
 * The date portion is today; only hours/minutes are meaningful.
 */
export function minutesToDate(mins: number): Date {
  const d = new Date();
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

/**
 * Precision levels for formatDuration.
 * Each level includes all coarser units and adds the named unit.
 */
export type DurationPrecision = 'hours' | 'minutes' | 'seconds' | 'milliseconds';

/**
 * Formats a duration in milliseconds.
 *
 * @param ms         Duration in milliseconds. Pass null to get '--'.
 * @param precision  Finest unit to display. Defaults to 'minutes' (preserving
 *                   the original behaviour for all sleep/strain/recovery callers).
 *
 * Examples at precision='minutes':  "1h 30m", "45m"
 * Examples at precision='seconds':  "1h 30m 15s", "0m 45s"
 * Examples at precision='milliseconds': "0m 45s 200ms"
 */
export function formatDuration(
  ms: number | null,
  precision: DurationPrecision = 'minutes',
): string {
  if (ms == null) return '--';
  const totalMs = Math.max(0, Math.floor(ms));

  const years = Math.floor(totalMs / (365.25 * 24 * 60 * 60 * 1000));
  const rem1 = totalMs % (365.25 * 24 * 60 * 60 * 1000);
  const weeks = Math.floor(rem1 / (7 * 24 * 60 * 60 * 1000));
  const rem2 = rem1 % (7 * 24 * 60 * 60 * 1000);
  const days = Math.floor(rem2 / (24 * 60 * 60 * 1000));
  const rem3 = rem2 % (24 * 60 * 60 * 1000);
  const hours = Math.floor(rem3 / (60 * 60 * 1000));
  const rem4 = rem3 % (60 * 60 * 1000);
  const minutes = Math.floor(rem4 / (60 * 1000));
  const rem5 = rem4 % (60 * 1000);
  const seconds = Math.floor(rem5 / 1000);
  const millis = rem5 % 1000;

  const parts: string[] = [];

  if (years > 0) parts.push(`${String(years)}y`);
  if (weeks > 0) parts.push(`${String(weeks)}w`);
  if (days > 0) parts.push(`${String(days)}d`);
  if (hours > 0) parts.push(`${String(hours)}h`);

  if (precision === 'hours') {
    return parts.length > 0 ? parts.join(' ') : '0h';
  }

  parts.push(`${String(minutes)}m`);

  if (precision === 'minutes') {
    // Drop leading "0m" only when a coarser unit is present
    if (minutes === 0 && parts.length > 1) parts.pop();
    return parts.join(' ');
  }

  parts.push(`${String(seconds)}s`);

  if (precision === 'seconds') {
    return parts.join(' ');
  }

  parts.push(`${String(millis)}ms`);
  return parts.join(' ');
}

/**
 * Parses a 'HH:mm' time string into a Date (today's date, time set to h:m).
 */
export function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Formats a Date into { hours, minutes, ampm } parts for 12-hour display.
 */
export function formatDisplayTime(date: Date): { hours: string; minutes: string; ampm: string } {
  const h = date.getHours();
  const m = date.getMinutes();
  return {
    hours: String(h % 12 || 12),
    minutes: String(m).padStart(2, '0'),
    ampm: h >= 12 ? 'PM' : 'AM',
  };
}

/**
 * Parses an ISO date string ('YYYY-MM-DD') into a local Date at midnight.
 */
export function dateFromISO(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

/**
 * Formats a Date as a local 'YYYY-MM-DD' string.
 */
export function isoFromDate(date: Date): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns today's date as a local 'YYYY-MM-DD' string. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${day}`;
}

/** Returns the local 'YYYY-MM-DD' string N days before today (or an optional anchor date). */
export function daysAgoISO(n: number, anchor?: string): string {
  const d = anchor ? new Date(anchor + 'T12:00:00') : new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${day}`;
}

/**
 * Returns the ISO 8601 week number (1–53) for a given date.
 * Week 1 is the week containing the first Thursday of the year.
 */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday in current week — ISO weeks start Monday, Thursday decides the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Formats a 'YYYY-MM-DD' string as a human-readable date header (e.g. "Mon, March 31, 2026"). */
export function formatDateHeader(dateStr: string, locale?: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale ?? [], {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Returns a 'YYYY-Www' string for a given date. */
export function isoWeekKey(date: Date): string {
  // Use the Thursday of the week to get the correct ISO year
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const week = isoWeekNumber(date);
  return `${String(thursday.getUTCFullYear())}-W${String(week).padStart(2, '0')}`;
}

/**
 * Builds an array of { dateStr, label } entries from `from` to `anchor` inclusive.
 * Used by dual-axis trend hooks to generate a consistent 7-day x-axis.
 */
export function buildTrendDates(
  from: string,
  anchor: string,
  locale: string,
): { dateStr: string; label: string }[] {
  const days = Math.round(
    (new Date(anchor + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) /
      86_400_000,
  );
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(from + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateStr > anchor) return null;
    const label = d.toLocaleDateString(locale, { weekday: 'short' });
    return { dateStr, label };
  }).filter((x): x is { dateStr: string; label: string } => x !== null);
}
