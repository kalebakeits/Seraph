export type Sex = 'male' | 'female' | '';
export type PageKey =
  | 'welcome'
  | 'theme'
  | 'profile'
  | 'sensitivity'
  | 'storage'
  | 'connect'
  | 'done';
export type SensitivityPreset = 'everything' | 'light' | 'moderate' | 'workoutsOnly' | 'off';

export interface ProfileDraft {
  name: string;
  dob: string;
  sex: Sex;
  height_cm: string;
  weight_kg: string;
  sleep_goal_minutes: number;
  fthr: string;
}

export const SENSITIVITY_PRESETS: { key: SensitivityPreset; minTrimp: number; minMs: number }[] = [
  { key: 'everything', minTrimp: 3.0, minMs: 900_000 },
  { key: 'light', minTrimp: 8.0, minMs: 900_000 },
  { key: 'moderate', minTrimp: 20.0, minMs: 900_000 },
  { key: 'workoutsOnly', minTrimp: 40.0, minMs: 900_000 },
  { key: 'off', minTrimp: 9999.0, minMs: 900_000 },
];
