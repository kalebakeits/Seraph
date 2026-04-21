import { StrainContent } from './content/StrainContent';
import { RecoveryContent } from './content/RecoveryContent';
import { SleepContent } from './content/SleepContent';
import { HrvContent } from './content/HrvContent';
import { RhrContent } from './content/RhrContent';
import { StepsContent } from './content/StepsContent';
import { ActiveTimeContent } from './content/ActiveTimeContent';
import { SkinTempContent } from './content/SkinTempContent';
import { DailyStressContent } from './content/DailyStressContent';
import { SleepAwakeContent } from './content/SleepAwakeContent';
import type { TrendKey, TrendConfigEntry } from './TrendTypes';

export type { TrendKey, TrendContentProps, TrendConfigEntry } from './TrendTypes';

export const TREND_CONFIG: Record<TrendKey, TrendConfigEntry> = {
  strain: {
    icon: 'flame-outline',
    nameKey: 'home.strain',
    getColor: t => t.colors.strain,
    getTint: t => t.colors.iconTint.strain,
    Content: StrainContent,
  },
  recovery: {
    icon: 'battery-charging-outline',
    nameKey: 'home.recovery',
    getColor: t => t.colors.recovery,
    getTint: t => t.colors.iconTint.recovery,
    Content: RecoveryContent,
  },
  sleep: {
    icon: 'moon-outline',
    nameKey: 'home.sleep',
    getColor: t => t.colors.sleep,
    getTint: t => t.colors.iconTint.sleep,
    Content: SleepContent,
  },
  hrv: {
    icon: 'pulse-outline',
    nameKey: 'home.hrv',
    getColor: t => t.colors.recovery,
    getTint: t => t.colors.iconTint.recovery,
    Content: HrvContent,
  },
  rhr: {
    icon: 'heart-outline',
    nameKey: 'home.rhr',
    getColor: t => t.colors.sleep,
    getTint: t => t.colors.iconTint.sleep,
    Content: RhrContent,
  },
  steps: {
    icon: 'footsteps-outline',
    nameKey: 'home.steps',
    getColor: t => t.colors.steps,
    getTint: t => t.colors.iconTint.steps,
    Content: StepsContent,
  },
  activeTime: {
    icon: 'walk-outline',
    nameKey: 'home.activeTime',
    getColor: t => t.colors.active,
    getTint: t => t.colors.iconTint.active,
    Content: ActiveTimeContent,
  },
  skinTemp: {
    icon: 'thermometer-outline',
    nameKey: 'home.skinTemp',
    getColor: t => t.colors.skinTemp,
    getTint: t => t.colors.iconTint.skinTemp,
    Content: SkinTempContent,
  },
  dailyStress: {
    icon: 'body-outline',
    nameKey: 'home.dailyStress',
    getColor: t => t.colors.recovery,
    getTint: t => t.colors.iconTint.recovery,
    Content: DailyStressContent,
  },
  sleepAwake: {
    icon: 'eye-outline',
    nameKey: 'nav.trendSleepAwake',
    getColor: t => t.colors.sleep,
    getTint: t => t.colors.iconTint.sleep,
    Content: SleepAwakeContent,
  },
};

export const TREND_ORDER: TrendKey[] = [
  'strain',
  'recovery',
  'sleep',
  'hrv',
  'rhr',
  'steps',
  'activeTime',
  'skinTemp',
  'dailyStress',
  'sleepAwake',
];
