import React from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../../components/common/Section';
import { HelperText } from '../../../components/common/HelperText';
import { WorkoutHighlightCard } from '../../home/overview/components/WorkoutHighlightCard';
import { useStrainWorkouts } from '../hooks/useStrainWorkouts';

interface Props {
  anchorDate?: string;
  onWorkoutPress?: (activityId: number) => void;
}

export const StrainWorkoutsSection: React.FC<Props> = ({ anchorDate, onWorkoutPress }) => {
  const { t } = useTranslation();
  const { data: workouts = [] } = useStrainWorkouts(anchorDate);

  if (workouts.length === 0) return null;

  return (
    <Section title={t('strain.workouts')}>
      <HelperText translationKey="strain.workoutsHelper" />
      {workouts.map(w => (
        <WorkoutHighlightCard
          key={w.id}
          item={w}
          onPress={
            onWorkoutPress
              ? () => {
                  onWorkoutPress(w.id);
                }
              : undefined
          }
        />
      ))}
    </Section>
  );
};
