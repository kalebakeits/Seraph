import type { TrainingZone } from '../hooks/useTrainingLoad';

export const ZONE_CONFIG: Record<TrainingZone, { label: string; color: string }> = {
  detraining: { label: 'Detraining', color: '#f5576c' },
  recovery: { label: 'Recovery', color: '#4facfe' },
  maintaining: { label: 'Maintaining', color: '#2ecc71' },
  productive: { label: 'Productive', color: '#2ecc71' },
  overreaching: { label: 'Overreaching', color: '#f39c12' },
  overtraining: { label: 'Overtraining', color: '#f5576c' },
};

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
export const ARC_ZONES: [number, number, string][] = [
  [0.5, 0.8, 'rgba(255,255,255,0.15)'], // detraining — gray (no-data baseline)
  [0.8, 1.0, '#4facfe'], // recovery
  [1.0, 1.25, '#2ecc71'], // productive (includes maintaining)
  [1.25, 1.5, '#f39c12'], // overreaching
  [1.5, 1.75, '#f5576c'], // overtraining
];
