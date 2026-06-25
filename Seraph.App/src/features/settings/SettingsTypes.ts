export type Sex = 'male' | 'female' | '';
export type SensitivityPreset = 'everything' | 'light' | 'moderate' | 'workoutsOnly' | 'off';

export interface ProfileState {
  name: string;
  dob: string; // ISO date string "YYYY-MM-DD"
  sex: Sex;
  height_cm: string;
  weight_kg: string;
  sleep_goal_minutes: number;
  fthr: string;
}

export interface PreferencesState {
  sensitivity: SensitivityPreset;
  language: string;
}

export const SENSITIVITY_PRESETS: { key: SensitivityPreset; minTrimp: number; minMs: number }[] = [
  { key: 'everything', minTrimp: 3.0, minMs: 900_000 },
  { key: 'light', minTrimp: 8.0, minMs: 900_000 },
  { key: 'moderate', minTrimp: 20.0, minMs: 900_000 },
  { key: 'workoutsOnly', minTrimp: 40.0, minMs: 900_000 },
  { key: 'off', minTrimp: 9999.0, minMs: 900_000 },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export function trimpToPreset(trimp: number | null): SensitivityPreset {
  if (trimp === null) return 'moderate';
  if (trimp >= 9999.0) return 'off';
  if (trimp <= 3.0) return 'everything';
  if (trimp <= 8.0) return 'light';
  if (trimp <= 20.0) return 'moderate';
  return 'workoutsOnly';
}

export function dobToAge(iso: string): number | null {
  if (!iso) return null;
  const dob = new Date(iso);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
