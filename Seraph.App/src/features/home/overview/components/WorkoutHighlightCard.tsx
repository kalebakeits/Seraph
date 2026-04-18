import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../../components/common/SafeText';
import { StatItem } from '../../../../components/common/StatItem';
import { useTheme, type Theme } from '../../../../theme';
import type { ActivityItem } from '../../hooks/useActivities';
import { buildSectionStyles } from '../../../../theme/shared/SectionStyles';

interface Props {
  item: ActivityItem;
  onPress?: () => void;
}

export const WorkoutHighlightCard: React.FC<Props> = ({ item, onPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={sectionStyles.container}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={sectionStyles.header}>
        <Ionicons name="barbell-outline" size={18} color={theme.colors.active} />
        <View style={styles.titleBlock}>
          <SafeText style={sectionStyles.title}>
            {t(item.activityType, { defaultValue: item.activityType })}
          </SafeText>
          <SafeText style={styles.subtitle}>
            {item.startTime} – {item.endTime}
          </SafeText>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCol}>
          <StatItem iconName="time-outline" label={t('workout.duration')} value={item.duration} />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="heart-outline"
            label={t('workout.avg')}
            value={item.avgHr != null ? `${String(Math.round(item.avgHr))} bpm` : '--'}
          />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="pulse-outline"
            label={t('workout.max')}
            value={item.maxHr != null ? `${String(Math.round(item.maxHr))} bpm` : '--'}
          />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="flame-outline"
            label={t('workout.trimp')}
            value={item.trimp != null ? String(Math.round(item.trimp)) : '--'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    titleBlock: {
      flex: 1,
      marginLeft: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.xxs,
    },
    statGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    statCol: {
      flex: 1,
    },
  });
}
