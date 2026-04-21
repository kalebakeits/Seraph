import type React from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Theme } from '../../theme';
import type { TrendRange } from './useTrendData';

export type TrendKey =
  | 'strain'
  | 'recovery'
  | 'sleep'
  | 'hrv'
  | 'rhr'
  | 'steps'
  | 'activeTime'
  | 'skinTemp'
  | 'dailyStress'
  | 'sleepAwake';

export interface TrendContentProps {
  range: TrendRange;
  onRangeChange: (r: TrendRange) => void;
  anchorDate?: string;
  theme: Theme;
}

export interface TrendConfigEntry {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  nameKey: string;
  getColor: (theme: Theme) => string;
  getTint: (theme: Theme) => string;
  Content: React.FC<TrendContentProps>;
}
