import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { SafeText } from '../../components/common/SafeText';
import { Section } from '../../components/common/Section';
import { HelperText } from '../../components/common/HelperText';
import { StrainCard } from './components/StrainCard';
import { StrainBarChart } from './components/StrainBarChart';
import { TrainingLoadCard } from './components/TrainingLoadCard';
import { TrainingLoadHistoryCard } from './components/TrainingLoadHistoryCard';
import { StrainWorkoutsSection } from './components/StrainWorkoutsSection';
import { theme } from '../../theme';
import { formatDateHeader, todayISO } from '../../utils/dateUtils';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Strain'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

export const Strain: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const date = route.params?.selectedDate ?? todayISO();

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <SafeText style={styles.dateHeader}>{formatDateHeader(date)}</SafeText>
      <HelperText translationKey="strain.pageHelper" />

      <Section title={t('common.today')}>
        <HelperText translationKey="strain.todayHelper" />
        <StrainCard anchorDate={date} />
      </Section>

      <StrainWorkoutsSection
        anchorDate={date}
        onWorkoutPress={id => {
          navigation.navigate('WorkoutDetail', { activityId: id, selectedDate: date });
        }}
      />

      <Section
        title={t('common.strainTrends')}
        onTitlePress={() => {
          navigation.navigate('TrendStrain', { anchorDate: route.params?.selectedDate });
        }}
      >
        <HelperText translationKey="strain.trendsHelper" />
        <StrainBarChart anchorDate={date} />
      </Section>

      <Section title={t('strain.trainingLoad')}>
        <HelperText translationKey="strain.trainingLoadHelper" />
        <TrainingLoadCard anchorDate={date} />
        <TrainingLoadHistoryCard anchorDate={date} />
      </Section>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  dateHeader: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    paddingHorizontal: 2,
    marginBottom: theme.spacing.xs,
  },
});
