import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { StatItem } from '../../../components/common/StatItem';
import { ActivityRing } from '../../../components/common/ActivityRing';
import { useTheme, type Theme } from '../../../theme';
import { useRecentSleep } from './useRecentSleep';
import { useSleepNeedMinutes } from '../hooks/useSleepNeed';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { formatDuration } from '../../../utils/dateUtils';

interface LastNightCardProps {
  selectedDate: string;
  onPress?: () => void;
  onEditPress?: () => void;
  showRing?: boolean;
}

export const LastNightCard: React.FC<LastNightCardProps> = ({
  selectedDate,
  onPress,
  onEditPress,
  showRing = true,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  const { data: recent } = useRecentSleep(selectedDate);
  const needMinutes = useSleepNeedMinutes(selectedDate);

  const goalLabel =
    needMinutes != null
      ? t('sleep.goalHours', { duration: formatDuration(needMinutes * 60_000) })
      : '';

  return (
    <TouchableOpacity
      style={sectionStyles.container}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={sectionStyles.header}>
            <Ionicons name="moon-outline" size={18} color={theme.colors.sleep} />
            <SafeText style={sectionStyles.title}> {t('home.sleep')}</SafeText>
            {onEditPress && recent && (
              <TouchableOpacity onPress={onEditPress} style={styles.editButton} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.heroRow}>
            <SafeText style={styles.heroValue}>{recent?.totalSleepFormatted ?? '--'}</SafeText>
            <SafeText style={styles.heroGoal}>{goalLabel}</SafeText>
          </View>
        </View>
        {showRing && (
          <ActivityRing
            value={recent?.quality ?? null}
            goal={100}
            size={80}
            strokeWidth={7}
            color={theme.colors.sleep}
            label=""
            unit="%"
          />
        )}
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCol}>
          <StatItem
            iconName="bed-outline"
            label={t('sleep.bedtime')}
            value={recent?.bedtime ?? '--'}
          />
          <StatItem
            iconName="sunny-outline"
            label={t('sleep.wake')}
            value={recent?.wakeTime ?? '--'}
          />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="heart-outline"
            label={t('sleep.avgHr')}
            value={
              recent?.avgHr != null
                ? t('sleep.avgHrValue', { value: Math.round(recent.avgHr) })
                : '--'
            }
          />
          <StatItem
            iconName="pulse-outline"
            label={t('sleep.hrv')}
            value={recent?.hrv != null ? t('sleep.hrvValue', { value: recent.hrv }) : '--'}
          />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="heart-dislike-outline"
            label={t('sleep.rhr')}
            value={recent?.rhr != null ? t('sleep.rhrValue', { value: recent.rhr }) : '--'}
          />
          <StatItem
            iconName="eye-outline"
            label={t('sleep.stageAwake')}
            value={recent != null ? formatDuration(recent.awakeMinutes * 60_000) : '--'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    leftCol: { flex: 1 },
    editButton: { padding: 4 },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    heroValue: {
      fontSize: theme.typography.sizes.hero,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    heroGoal: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.tertiary,
    },
    statGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    statCol: {
      flex: 1,
      gap: theme.spacing.md,
    },
  });
}
