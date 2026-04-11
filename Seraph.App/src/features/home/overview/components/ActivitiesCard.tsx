import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../theme';
import { SafeText } from '../../../../components/common/SafeText';
import { useActivities } from '../../hooks/useActivities';
import type { ActivityItem } from '../../hooks/useActivities';
import { ActivityType } from '../../../../types/ActivityType';
import { ActivityActionSheet } from '../sheets/ActivityActionSheet';
import { Section } from '../../../../components/common/Section';
import { todayISO } from '../../../../utils/dateUtils';

const COLLAPSED_COUNT = 3;

function activityIcon(item: ActivityItem): {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
} {
  if (item.type === ActivityType.Sleep) return { name: 'moon-outline', color: theme.colors.sleep };
  const t = item.activityType.toLowerCase();
  if (t.includes('run')) return { name: 'walk-outline', color: theme.colors.active };
  if (t.includes('cycle') || t.includes('bike'))
    return { name: 'bicycle-outline', color: theme.colors.active };
  if (t.includes('swim')) return { name: 'water-outline', color: theme.colors.active };
  return { name: 'barbell-outline', color: theme.colors.active };
}

interface ActivitiesCardProps {
  selectedDate?: string;
  onActivityPress?: (id: number, type: ActivityType) => void;
}

export const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
  selectedDate,
  onActivityPress,
}) => {
  const { t } = useTranslation();
  const { data: activities = [] } = useActivities(selectedDate);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isToday = !selectedDate || selectedDate === todayISO();

  const visible = expanded ? activities : activities.slice(0, COLLAPSED_COUNT);
  const hasMore = activities.length > COLLAPSED_COUNT;

  const addButton = (
    <TouchableOpacity
      style={styles.addButton}
      activeOpacity={0.7}
      onPress={() => {
        setActionSheetOpen(true);
      }}
    >
      <Ionicons name="add" size={18} color={theme.colors.text.primary} />
    </TouchableOpacity>
  );

  return (
    <Section title={t('home.activities')} action={addButton}>
      {activities.length === 0 && (
        <View style={styles.emptyCard}>
          <SafeText style={styles.empty}>{t('home.noActivitiesRecorded')}</SafeText>
        </View>
      )}

      {visible.map(item => {
        const { name: iconName, color: iconColor } = activityIcon(item);
        return (
          <TouchableOpacity
            key={`${item.type}-${String(item.id)}`}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onActivityPress?.(item.id, item.type)}
          >
            <View style={styles.iconCircle}>
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

      {actionSheetOpen && selectedDate && (
        <ActivityActionSheet
          selectedDate={selectedDate}
          isToday={isToday}
          onClose={() => {
            setActionSheetOpen(false);
          }}
        />
      )}
    </Section>
  );
};

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
    paddingHorizontal: 2,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    gap: 4,
  },
  expandButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
});
