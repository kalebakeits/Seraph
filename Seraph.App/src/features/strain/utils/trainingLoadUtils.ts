import type { Theme } from '../../../theme';
import type { TrainingZone } from '../hooks/useTrainingLoad';

export function ZONE_CONFIG(theme: Theme): Record<TrainingZone, { label: string; color: string }> {
  return {
    detraining: { label: 'Detraining', color: theme.colors.trainingLoad.detraining },
    recovery: { label: 'Recovery', color: theme.colors.trainingLoad.recovery },
    maintaining: { label: 'Maintaining', color: theme.colors.trainingLoad.maintaining },
    productive: { label: 'Productive', color: theme.colors.trainingLoad.productive },
    overreaching: { label: 'Overreaching', color: theme.colors.trainingLoad.overreaching },
    overtraining: { label: 'Overtraining', color: theme.colors.trainingLoad.overtraining },
  };
}

export const RATIO_MIN = 0.5;
export const RATIO_MAX = 1.75;
export const RATIO_CENTER = 1.0; // maintaining — maps to straight up (270°)
export const PRODUCTIVE_MIN = 1.05;
export const PRODUCTIVE_MAX = 1.25;

// Arc spans 180° total, centered at 270° (straight up).
// Ratio 1.0 (maintaining/zero baseline) = 270° = center.
// Left half [180°–270°] = [RATIO_MIN–RATIO_CENTER]
// Right half [270°–360°] = [RATIO_CENTER–RATIO_MAX]
export function ratioToSkiaDeg(ratio: number): number {
  const clamped = Math.max(RATIO_MIN, Math.min(RATIO_MAX, ratio));
  if (clamped <= RATIO_CENTER) {
    // Left half: RATIO_MIN→180°, RATIO_CENTER→270°
    return 180 + ((clamped - RATIO_MIN) / (RATIO_CENTER - RATIO_MIN)) * 90;
  } else {
    // Right half: RATIO_CENTER→270°, RATIO_MAX→360°
    return 270 + ((clamped - RATIO_CENTER) / (RATIO_MAX - RATIO_CENTER)) * 90;
  }
}

// Zones: first band gray (detraining/no-data baseline), then color by zone
export function ARC_ZONES(theme: Theme): [number, number, string][] {
  return [
    [0.5, 0.8, theme.colors.overlay.medium], // detraining — gray (no-data baseline)
    [0.8, 1.0, theme.colors.trainingLoad.recovery], // recovery
    [1.0, 1.25, theme.colors.trainingLoad.productive], // productive (includes maintaining)
    [1.25, 1.5, theme.colors.trainingLoad.overreaching], // overreaching
    [1.5, 1.75, theme.colors.trainingLoad.overtraining], // overtraining
  ];
}
