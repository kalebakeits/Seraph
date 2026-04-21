import React from 'react';
import { ActivityRing } from '../../../components/common/ActivityRing';
import { useTheme, type Theme } from '../../../theme';

interface Props {
  score: number | null;
}

export function scoreColor(score: number, theme: Theme): string {
  if (score < 33) return theme.colors.recoveryColors.low;
  if (score < 66) return theme.colors.recoveryColors.medium;
  return theme.colors.recoveryColors.high;
}

export const RecoveryScore: React.FC<Props> = ({ score }) => {
  const { theme } = useTheme();
  return (
    <ActivityRing
      value={score}
      goal={100}
      size={96}
      strokeWidth={8}
      color={score !== null ? scoreColor(score, theme) : theme.colors.text.tertiary}
      label=""
      unit="%"
    />
  );
};
