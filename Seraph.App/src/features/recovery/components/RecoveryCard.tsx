import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { ActivityRing } from '../../../components/common/ActivityRing';
import { RecoveryStatItem } from './RecoveryStatItem';
import { theme } from '../../../theme';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { scoreColor } from './RecoveryScore';
import type { RecoveryFactorsData } from '../hooks/useRecoveryFactors';
import { formatDuration } from '../../../utils/dateUtils';

interface Props {
  data: RecoveryFactorsData | undefined;
}

export const RecoveryCard: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();

  const score = data?.score ?? null;
  const ringColor = score !== null ? scoreColor(score) : theme.colors.recovery;

  const hrv = data?.factors.find(f => f.key === 'hrv');
  const rhr = data?.factors.find(f => f.key === 'rhr');
  const sleep = data?.factors.find(f => f.key === 'sleep');

  return (
    <View style={sectionStyles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={sectionStyles.header}>
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.recovery} />
            <SafeText style={sectionStyles.title}> {t('home.recovery')}</SafeText>
          </View>
          <View style={styles.heroRow}>
            <SafeText style={[styles.heroValue, { color: ringColor }]} />
          </View>
        </View>
        <ActivityRing
          value={score}
          goal={100}
          size={80}
          strokeWidth={7}
          color={ringColor}
          label=""
          unit="%"
        />
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCol}>
          <RecoveryStatItem
            iconName="pulse-outline"
            label={t('sleep.hrv')}
            value={hrv?.value != null ? `${String(hrv.value)} ms` : '--'}
            baseline={hrv?.baseline != null ? `${String(hrv.baseline)} ms` : undefined}
            direction={hrv?.direction}
            favorable={hrv?.favorable}
          />
        </View>
        <View style={styles.statCol}>
          <RecoveryStatItem
            iconName="heart-dislike-outline"
            label={t('sleep.rhr')}
            value={rhr?.value != null ? `${String(rhr.value)} bpm` : '--'}
            baseline={rhr?.baseline != null ? `${String(rhr.baseline)} bpm` : undefined}
            direction={rhr?.direction}
            favorable={rhr?.favorable}
          />
        </View>
        <View style={styles.statCol}>
          <RecoveryStatItem
            iconName="moon-outline"
            label={t('home.sleep')}
            value={formatDuration(sleep?.value != null ? sleep.value * 60_000 : null)}
            baseline={formatDuration(sleep?.baseline != null ? sleep.baseline * 60_000 : null)}
            direction={sleep?.direction}
            favorable={sleep?.favorable}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  leftCol: { flex: 1 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.xs,
  },
  heroValue: {
    fontSize: theme.typography.sizes.hero,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCol: { flex: 1 },
});
