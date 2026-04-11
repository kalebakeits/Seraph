import React from 'react';
import type { ActivityItem } from '../../hooks/useActivities';
import { SleepSessionStatsCard } from '../../../sleep/session/SleepSessionStatsCard';
import { useSleepSession } from '../../../sleep/hooks/useSleepSession';

interface Props {
  item: ActivityItem;
}

export const NapHighlightCard: React.FC<Props> = ({ item }) => {
  const { data: nap } = useSleepSession(item.id);

  if (!nap) return null;

  return <SleepSessionStatsCard session={nap} />;
};
