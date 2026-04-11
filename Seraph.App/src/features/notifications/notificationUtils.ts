import type { Ionicons } from '@expo/vector-icons';
import { formatDuration } from '../../utils/dateUtils';
import { theme } from '../../theme';

export interface NotificationPayload {
  screen?: string;
  activityId?: number;
  sleepId?: number;
  start_ts?: number;
  end_ts?: number;
  duration_minutes?: number;
  score?: number;
  avg_hr?: number;
  sport?: string;
}

export function parsePayload(raw: string | null): NotificationPayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as NotificationPayload;
  } catch {
    return {};
  }
}

/**
 * Maps notification type + payload sport to the activity-card icon style.
 */
export function iconForNotification(
  type: string,
  sport: string | undefined,
): { name: React.ComponentProps<typeof Ionicons>['name']; color: string } {
  const isSleep = type === 'sleep_detected' || type === 'sleep_edited';
  if (isSleep) return { name: 'moon', color: theme.colors.sleep };

  const s = (sport ?? '').toLowerCase();
  if (s.includes('run') || s.includes('course'))
    return { name: 'walk-outline', color: theme.colors.active };
  if (s.includes('cycl') || s.includes('bike') || s.includes('vél'))
    return { name: 'bicycle-outline', color: theme.colors.active };
  if (s.includes('swim') || s.includes('nata'))
    return { name: 'water-outline', color: theme.colors.active };
  return { name: 'barbell-outline', color: theme.colors.active };
}

/**
 * Notification title — event type with optional sport prefix.
 * e.g. "Running · Workout recorded" / "Sleep recorded"
 */
export function formatNotificationTitle(
  typeLabel: string,
  sportLabel?: string,
  _payload?: NotificationPayload,
  _lang?: string,
): string {
  if (sportLabel) return `${sportLabel} · ${typeLabel}`;
  return typeLabel;
}

/**
 * Notification body — date, duration, and a key metric (score or avg HR).
 * e.g. "Wednesday, April 8 · 1h 30m · avg 142 bpm"
 */
export function formatNotificationDetail(
  payload: NotificationPayload,
  lang: string,
  scoreLabel: string,
  avgHrLabel: string,
): string {
  const parts: string[] = [];

  if (payload.start_ts != null) {
    parts.push(
      new Date(payload.start_ts).toLocaleDateString(lang, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    );
  }

  if (payload.duration_minutes != null) {
    parts.push(formatDuration(payload.duration_minutes * 60_000));
  }

  if (payload.score != null) {
    parts.push(scoreLabel);
  } else if (payload.avg_hr != null) {
    parts.push(avgHrLabel);
  }

  return parts.join(' · ');
}
