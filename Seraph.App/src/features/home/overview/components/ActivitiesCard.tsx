import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Theme } from '../../../../theme';
import { SafeText } from '../../../../components/common/SafeText';
import { useActivities } from '../../hooks/useActivities';
import type { ActivityItem } from '../../hooks/useActivities';
import { ActivityType } from '../../../../types/ActivityType';
import { Section } from '../../../../components/common/Section';

const COLLAPSED_COUNT = 3;

function activityIcon(
  item: ActivityItem,
  theme: Theme,
): { name: React.ComponentProps<typeof Ionicons>['name']; color: string; tint: string } {
  if (item.type === ActivityType.Sleep)
    return { name: 'moon-outline', color: theme.colors.sleep, tint: theme.colors.iconTint.sleep };
  const t = item.activityType.toLowerCase();
  if (t.includes('run'))
    return { name: 'walk-outline', color: theme.colors.active, tint: theme.colors.iconTint.active };
  if (t.includes('cycle') || t.includes('bike'))
    return {
      name: 'bicycle-outline',
      color: theme.colors.active,
      tint: theme.colors.iconTint.active,
    };
  if (t.includes('swim'))
    return {
      name: 'water-outline',
      color: theme.colors.active,
      tint: theme.colors.iconTint.active,
    };
  return {
    name: 'barbell-outline',
    color: theme.colors.active,
    tint: theme.colors.iconTint.active,
  };
}

interface ActivitiesCardProps {
  selectedDate?: string;
  onActivityPress?: (id: number, type: ActivityType) => void;
}

export const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
  selectedDate,
  onActivityPress,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const { data: activities = [] } = useActivities(selectedDate);
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? activities : activities.slice(0, COLLAPSED_COUNT);
  const hasMore = activities.length > COLLAPSED_COUNT;

  return (
    <Section title={t('home.activities')}>
      {activities.length === 0 && (
        <View style={styles.emptyCard}>
          <SafeText style={styles.empty}>{t('home.noActivitiesRecorded')}</SafeText>
        </View>
      )}

      {visible.map(item => {
        const { name: iconName, color: iconColor, tint: iconTint } = activityIcon(item, theme);
        return (
          <TouchableOpacity
            key={`${item.type}-${String(item.id)}`}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onActivityPress?.(item.id, item.type)}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: iconTint, borderColor: iconColor }]}
            >
              <Ionicons name={iconName} size={18} color={iconColor} />
            </View>
            <View style={styles.cardContent}>
              <SafeText style={styles.activityName}>
                {item.activityType.startsWith('activities.')
                  ? t(item.activityType)
                  : item.activityType}
              </SafeText>
              <SafeText style={styles.duration}>{item.duration}</SafeText>
            </View>
            <View style={styles.times}>
              <SafeText style={styles.time}>{item.startTime}</SafeText>
              <SafeText style={styles.time}>{item.endTime}</SafeText>
            </View>
          </TouchableOpacity>
        );
      })}

      {hasMore && (
        <TouchableOpacity
          style={styles.expandButton}
          activeOpacity={0.7}
          onPress={() => {
            setExpanded(e => !e);
          }}
        >
          <SafeText style={styles.expandButtonText}>
            {expanded
              ? t('activities.showLess')
              : t('activities.showAll', { count: activities.length })}
          </SafeText>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      )}
    </Section>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    emptyCard: {
      ...theme.cardStyles.default,
      alignItems: 'center',
    },
    empty: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.tertiary,
      paddingVertical: theme.spacing.sm,
    },
    card: {
      ...theme.cardStyles.default,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconCircle: {
      width: theme.layout.iconSize.md,
      height: theme.layout.iconSize.md,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
    },
    activityName: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    duration: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.secondary,
      marginTop: 1,
    },
    times: {
      alignItems: 'flex-end',
    },
    time: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.secondary,
    },
    expandButton: {
      ...theme.cardStyles.default,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    expandButtonText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.weights.medium,
    },
  });
}
