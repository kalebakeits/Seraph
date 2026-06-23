import type { Ionicons } from '@expo/vector-icons';
import type { Theme } from '../../theme';
import { formatDuration } from '../../utils/dateUtils';

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
  version?: string;
  title?: string;
  body?: string;
}

export function parsePayload(raw: string | null): NotificationPayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as NotificationPayload;
  } catch {
    return {};
  }
}

const SYSTEM_TYPES = new Set(['update_available', 'announcement']);

export function isSystemNotification(type: string): boolean {
  return SYSTEM_TYPES.has(type);
}

export function iconForNotification(
  type: string,
  sport: string | undefined,
  theme: Theme,
): { name: React.ComponentProps<typeof Ionicons>['name']; color: string; tint: string } {
  if (type === 'update_available' || type === 'announcement')
    return {
      name: 'megaphone-outline',
      color: theme.colors.primary,
      tint: theme.colors.iconTint.primary,
    };

  const isSleep = type === 'sleep_detected' || type === 'sleep_edited';
  if (isSleep)
    return { name: 'moon-outline', color: theme.colors.sleep, tint: theme.colors.iconTint.sleep };

  const s = (sport ?? '').toLowerCase();
  if (s.includes('run') || s.includes('course'))
    return { name: 'walk-outline', color: theme.colors.active, tint: theme.colors.iconTint.active };
  if (s.includes('cycl') || s.includes('bike') || s.includes('vél'))
    return {
      name: 'bicycle-outline',
      color: theme.colors.active,
      tint: theme.colors.iconTint.active,
    };
  if (s.includes('swim') || s.includes('nata'))
    return {
      name: 'water-outline',
      color: theme.colors.active,
      tint: theme.colors.iconTint.active,
    };
  return {
    name: 'barbell-outline',
    color: theme.colors.active,
    tint: theme.colors.iconTint.active,
  };
}

export function formatNotificationTitle(
  typeLabel: string,
  sportLabel?: string,
  _payload?: NotificationPayload,
  _lang?: string,
): string {
  if (sportLabel) return `${sportLabel} · ${typeLabel}`;
  return typeLabel;
}

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
