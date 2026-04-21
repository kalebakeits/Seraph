import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-native-date-picker';
import { SafeText } from '../../components/common/SafeText';
import { Section } from '../../components/common/Section';
import { HabitRow } from './components/HabitRow';
import { useActiveHabitsForDate } from './hooks/useActiveHabitsForDate';
import { useHabitLogs } from './hooks/useHabitLogs';
import { habitLogsRepository } from '../../services/database/drizzle';
import { navigationRef } from '../../navigation/navigationRef';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme, type Theme } from '../../theme';
import { dateFromISO, isoFromDate, todayISO } from '../../utils/dateUtils';

type RouteType = RouteProp<HomeStackParamList, 'LogHabits'>;

export const LogHabitsScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const route = useRoute<RouteType>();
  const queryClient = useQueryClient();

  const today = todayISO();
  const [date, setDate] = useState(route.params?.selectedDate ?? today);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { data: habits = [] } = useActiveHabitsForDate(date);
  const { data: existingLogs = [] } = useHabitLogs(date);

  const [pending, setPending] = useState<Record<number, number | null>>({});
  const pendingRef = useRef<Record<number, number | null>>({});
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const valueFor = (habitId: number): number | null => {
    if (habitId in pending) return pending[habitId];
    const log = existingLogs.find(l => l.habit_id === habitId);
    return log?.quantity ?? null;
  };

  const flushPending = useCallback(
    async (snapshot: Record<number, number | null>, currentDate: string) => {
      await Promise.all(
        Object.entries(snapshot).map(([idStr, value]) => {
          const habitId = Number(idStr);
          if (value === null) {
            return habitLogsRepository.delete(habitId, currentDate);
          }
          return habitLogsRepository.upsert({
            habit_id: habitId,
            date: currentDate,
            quantity: value,
          });
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ['habitLogs', currentDate] });
      void queryClient.invalidateQueries({ queryKey: ['habitConsistency'] });
    },
    [queryClient],
  );

  const handleChange = (habitId: number, value: number | null) => {
    const next = { ...pendingRef.current, [habitId]: value };
    pendingRef.current = next;
    setPending(next);
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      void flushPending(pendingRef.current, date);
    }, 800);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveRef.current) {
        clearTimeout(saveRef.current);
      }
    };
  }, []);

  // Cancel pending saves when date changes
  useEffect(() => {
    return () => {
      if (saveRef.current) {
        clearTimeout(saveRef.current);
      }
    };
  }, [date]);

  const dateLabel =
    date === today
      ? t('common.today')
      : dateFromISO(date).toLocaleDateString(i18n.language, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

  const chooseAction = (
    <TouchableOpacity
      style={styles.chooseBtn}
      activeOpacity={0.7}
      onPress={() => {
        navigationRef.navigate('ChooseHabits');
      }}
    >
      <Ionicons name="options-outline" size={14} color={theme.colors.recovery} />
      <SafeText style={styles.chooseBtnText}>{t('habits.chooseHabits')}</SafeText>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Section
          title={dateLabel}
          onTitlePress={() => {
            setDatePickerOpen(true);
          }}
          action={chooseAction}
        >
          {habits.length === 0 ? (
            <View style={styles.empty}>
              <SafeText style={styles.emptyTitle}>{t('habits.noActiveHabits')}</SafeText>
              <SafeText style={styles.emptyHint}>{t('habits.noActiveHabitsHint')}</SafeText>
            </View>
          ) : (
            <View style={styles.habitList}>
              {habits.map(habit => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  value={valueFor(habit.id)}
                  onChange={handleChange}
                />
              ))}
            </View>
          )}
        </Section>
      </ScrollView>

      <DatePicker
        modal
        mode="date"
        date={dateFromISO(date)}
        maximumDate={new Date()}
        open={datePickerOpen}
        onConfirm={d => {
          setDatePickerOpen(false);
          setDate(isoFromDate(d));
          setPending({});
          pendingRef.current = {};
        }}
        onCancel={() => {
          setDatePickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.layout.screenPadding,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },
    chooseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    chooseBtnText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.recovery,
      fontWeight: theme.typography.weights.semibold,
    },
    habitList: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    empty: {
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    emptyTitle: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.weights.semibold,
    },
    emptyHint: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.muted,
    },
  });
}
