import React from 'react';
import { useTranslation } from 'react-i18next';
import { LastNightCard } from '../../../sleep/last-night/LastNightCard';
import { NapHighlightCard } from './NapHighlightCard';
import { WorkoutHighlightCard } from './WorkoutHighlightCard';
import { Section } from '../../../../components/common/Section';
import type { ActivityItem } from '../../hooks/useActivities';
import { ActivityType } from '../../../../types/ActivityType';

interface ActivityHighlightProps {
  highlighted: ActivityItem | null;
  selectedDate?: string;
  onDismiss: () => void;
  onNavigate: (id: number, type: ActivityType) => void;
}

export const ActivityHighlight: React.FC<ActivityHighlightProps> = ({
  highlighted,
  selectedDate,
  onDismiss,
  onNavigate,
}) => {
  const { t } = useTranslation();
  if (!highlighted) return null;

  if (highlighted.type === ActivityType.Sleep && highlighted.isPrimary)
    return (
      <Section
        title={t('sleep.lastNight')}
        onDismiss={onDismiss}
        onPress={() => {
          onNavigate(highlighted.id, ActivityType.Sleep);
        }}
      >
        <LastNightCard selectedDate={selectedDate} showRing={false} />
      </Section>
    );

  if (highlighted.type === ActivityType.Sleep)
    return (
      <Section
        title={t('home.recentNap')}
        onDismiss={onDismiss}
        onPress={() => {
          onNavigate(highlighted.id, ActivityType.Sleep);
        }}
      >
        <NapHighlightCard item={highlighted} />
      </Section>
    );

  return (
    <Section
      title={t('home.recentWorkout')}
      onDismiss={onDismiss}
      onPress={() => {
        onNavigate(highlighted.id, ActivityType.Workout);
      }}
    >
      <WorkoutHighlightCard item={highlighted} />
    </Section>
  );
};
