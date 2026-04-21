import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useHabitConsistency } from '../hooks/useHabitConsistency';
import { navigationRef } from '../../../navigation/navigationRef';
import { todayISO } from '../../../utils/dateUtils';
import { useTheme, type Theme } from '../../../theme';

const DOT_SIZE = 32;
const DAYS = 7;

interface HabitConsistencyStripProps {
  selectedDate?: string;
}

export const HabitConsistencyStrip: React.FC<HabitConsistencyStripProps> = ({ selectedDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const { data: days = [] } = useHabitConsistency(DAYS, selectedDate);
  const today = todayISO();

  if (days.length === 0) return null;

  return (
    <View style={styles.container}>
      <SafeText style={styles.label}>{t('habits.consistency')}</SafeText>
      <View style={styles.strip}>
        {days.map(day => {
          const isToday = day.date === today;
          const hasSome = day.total > 0 && day.logged > 0;
          const isComplete = day.total > 0 && day.logged >= day.total;
          const isFuture = day.date > today;

          const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(i18n.language, {
            weekday: 'narrow',
          });

          return (
            <TouchableOpacity
              key={day.date}
              style={styles.dayCol}
              activeOpacity={isFuture ? 1 : 0.7}
              disabled={isFuture}
              onPress={() => {
                navigationRef.navigate('LogHabits', { selectedDate: day.date });
              }}
            >
              <View
                style={[
                  styles.dot,
                  isComplete && styles.dotComplete,
                  hasSome && !isComplete && styles.dotPartial,
                  isToday && styles.dotToday,
                  isFuture && styles.dotFuture,
                ]}
              >
                {isComplete && <View style={styles.checkMark} />}
                {hasSome && !isComplete && day.total > 0 && (
                  <View
                    style={[styles.partialFill, { height: DOT_SIZE * (day.logged / day.total) }]}
                  />
                )}
              </View>
              <SafeText style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {dayLabel}
              </SafeText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    strip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayCol: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      borderWidth: theme.borderWidth.medium,
      borderColor: theme.colors.overlay.medium,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotComplete: {
      backgroundColor: theme.colors.recovery,
      borderColor: theme.colors.recovery,
    },
    dotPartial: {
      borderColor: theme.colors.recovery,
    },
    dotToday: {
      borderColor: theme.colors.text.primary,
    },
    dotFuture: {
      opacity: 0.25,
    },
    partialFill: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.recovery,
      opacity: 0.35,
    },
    checkMark: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.icon.onLight,
    },
    dayLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
    dayLabelToday: {
      color: theme.colors.text.primary,
    },
  });
}
