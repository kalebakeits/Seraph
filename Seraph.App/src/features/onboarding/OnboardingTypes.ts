export type Sex = 'male' | 'female' | '';
export type PageKey =
  | 'welcome'
  | 'theme'
  | 'profile'
  | 'sensitivity'
  | 'storage'
  | 'connect'
  | 'done';
export type { SensitivityPreset } from '../settings/SettingsTypes';

export interface ProfileDraft {
  name: string;
  dob: string;
  sex: Sex;
  height_cm: string;
  weight_kg: string;
  sleep_goal_minutes: number;
  fthr: string;
}
