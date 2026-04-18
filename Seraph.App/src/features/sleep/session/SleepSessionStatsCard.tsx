import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { StatItem } from '../../../components/common/StatItem';
import { useTheme, type Theme } from '../../../theme';
import type { SleepEvent } from '../../../services/database/drizzle/schema';
import { formatTime, formatDuration } from '../../../utils/dateUtils';

interface Props {
  session: SleepEvent;
  onPress?: () => void;
}

export const SleepSessionStatsCard: React.FC<Props> = ({ session, onPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="moon-outline" size={18} color={theme.colors.sleep} />
          <View style={styles.titleText}>
            <View style={styles.titleRow}>
              <SafeText style={styles.title}> {t('sleep.nap')}</SafeText>
            </View>
          </View>
        </View>

        <View style={styles.heroRow}>
          <SafeText style={styles.heroValue}>
            {formatDuration(session.duration_minutes * 60_000)}
          </SafeText>
        </View>

        <View style={styles.statGrid}>
          <StatItem
            iconName="bed-outline"
            label={t('sleep.bedtime')}
            value={formatTime(session.start_ts)}
          />
          <StatItem
            iconName="sunny-outline"
            label={t('sleep.wake')}
            value={formatTime(session.end_ts)}
          />
          <StatItem
            iconName="heart-outline"
            label={t('sleep.avgHr')}
            value={
              session.avg_hr !== null
                ? t('sleep.avgHrValue', { value: Math.round(session.avg_hr) })
                : '--'
            }
          />
          <StatItem
            iconName="pulse-outline"
            label={t('sleep.hrv')}
            value={
              session.hrv_rmssd !== null
                ? t('sleep.hrvValue', { value: Math.round(session.hrv_rmssd) })
                : '--'
            }
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      ...theme.cardStyles.default,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    titleText: {
      marginLeft: theme.spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    heroRow: {
      marginBottom: theme.spacing.md,
    },
    heroValue: {
      fontSize: theme.typography.sizes.hero,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.md,
    },
  });
}
