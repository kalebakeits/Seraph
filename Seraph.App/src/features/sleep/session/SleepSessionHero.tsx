import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActivityRing } from '../../../components/common/ActivityRing';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { formatDuration, formatTime } from '../../../utils/dateUtils';

interface Props {
  durationMinutes: number;
  startTs: number;
  endTs: number;
  quality: number | null;
}

export const SleepSessionHero: React.FC<Props> = ({ durationMinutes, startTs, endTs, quality }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.ringCol}>
        <ActivityRing
          value={quality}
          goal={100}
          size={96}
          strokeWidth={8}
          color={theme.colors.sleep}
          label=""
          unit="%"
        />
      </View>

      <View style={styles.infoCol}>
        <SafeText style={styles.duration}>{formatDuration(durationMinutes * 60_000)}</SafeText>
        <View style={styles.timesRow}>
          <View style={styles.timeItem}>
            <SafeText style={styles.timeLabel}>{t('sleep.bedtime')}</SafeText>
            <SafeText style={styles.timeValue}>{formatTime(startTs)}</SafeText>
          </View>
          <SafeText style={styles.timeSep}>–</SafeText>
          <View style={styles.timeItem}>
            <SafeText style={styles.timeLabel}>{t('sleep.wake')}</SafeText>
            <SafeText style={styles.timeValue}>{formatTime(endTs)}</SafeText>
          </View>
        </View>
      </View>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      ...theme.cardStyles.default,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    ringCol: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xxs,
    },
    qualityCaption: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    infoCol: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    duration: {
      fontSize: theme.typography.sizes.hero,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    timesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    timeItem: {
      gap: theme.spacing.xxs,
    },
    timeLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    timeValue: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    timeSep: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.md,
    },
  });
}
