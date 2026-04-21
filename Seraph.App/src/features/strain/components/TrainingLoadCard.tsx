import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTrainingLoad } from '../hooks/useTrainingLoad';
import { ZONE_CONFIG } from '../utils/trainingLoadUtils';
import { SemiGauge } from './SemiGauge';

interface Props {
  anchorDate?: string;
}

export const TrainingLoadCard: React.FC<Props> = ({ anchorDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  const { data } = useTrainingLoad(anchorDate);
  const {
    atl,
    ctl,
    tsb,
    ratio,
    zone,
    hasData: _hasData,
  } = data ?? {
    atl: 0,
    ctl: 0,
    tsb: 0,
    ratio: 1,
    zone: 'maintaining' as const,
    hasData: false,
  };

  const zoneInfo = ZONE_CONFIG(theme)[zone];
  const tsbSign = tsb >= 0 ? '+' : '';

  return (
    <View style={sectionStyles.container}>
      <View style={styles.headerRow}>
        <SafeText style={styles.title}>{t('strain.loadRatio')}</SafeText>
        <View style={[styles.badge, { backgroundColor: zoneInfo.color + '33' }]}>
          <SafeText style={[styles.badgeText, { color: zoneInfo.color }]}>
            {t(`strain.zone.${zone}`)}
          </SafeText>
        </View>
      </View>
      <View style={styles.body}>
        <SemiGauge ratio={ratio} />
        <View style={styles.stats}>
          <View style={styles.stat}>
            <SafeText style={styles.statValue}>{ctl}</SafeText>
            <SafeText style={styles.statLabel}>{t('strain.fitness')}</SafeText>
          </View>
          <View style={styles.stat}>
            <SafeText style={styles.statValue}>{atl}</SafeText>
            <SafeText style={styles.statLabel}>{t('strain.fatigue')}</SafeText>
          </View>
          <View style={styles.stat}>
            <SafeText style={styles.statValue}>
              {tsbSign}
              {tsb}
            </SafeText>
            <SafeText style={styles.statLabel}>{t('strain.form')}</SafeText>
          </View>
        </View>
      </View>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    badge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    badgeText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
    },
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    stats: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    stat: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    statLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: theme.spacing.xxs,
    },
  });
}
