import React from 'react';
import { ActivityRing } from '../../../components/common/ActivityRing';
import { theme } from '../../../theme';

interface Props {
  score: number | null;
}

export function scoreColor(score: number): string {
  if (score < 33) return '#ff3b30';
  if (score < 66) return '#ffd60a';
  return theme.colors.recovery;
}

export const RecoveryScore: React.FC<Props> = ({ score }) => (
  <ActivityRing
    value={score}
    goal={100}
    size={96}
    strokeWidth={8}
    color={score !== null ? scoreColor(score) : theme.colors.text.tertiary}
    label=""
    unit="%"
  />
);
