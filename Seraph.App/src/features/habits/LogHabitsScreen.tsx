import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { theme } from '../../theme';

type RouteType = RouteProp<HomeStackParamList, 'LogHabits'>;

function dateFromISO(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function isoFromDate(date: Date): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const LogHabitsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const today = isoFromDate(new Date());
  const [date, setDate] = useState(route.params?.selectedDate ?? today);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<Record<number, number | null>>({});

  const { data: habits = [] } = useActiveHabitsForDate(date);
  const { data: existingLogs = [] } = useHabitLogs(date);

  const valueFor = (habitId: number): number | null => {
    if (habitId in pending) return pending[habitId];
    const log = existingLogs.find(l => l.habit_id === habitId);
    return log?.quantity ?? null;
  };

  const handleChange = (habitId: number, value: number | null) => {
    setPending(prev => ({ ...prev, [habitId]: value }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      for (const [habitIdStr, value] of Object.entries(pending)) {
        const habitId = Number(habitIdStr);
        if (value === null) {
          await habitLogsRepository.delete(habitId, date);
        } else {
          await habitLogsRepository.upsert({ habit_id: habitId, date, quantity: value });
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['habitLogs', date] });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const dateLabel =
    date === today
      ? t('common.today')
      : dateFromISO(date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

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

      <TouchableOpacity
        style={[styles.saveBtn, { marginBottom: insets.bottom + 16 }, saving && styles.disabled]}
        onPress={() => {
          void handleSave();
        }}
        activeOpacity={0.7}
        disabled={saving}
      >
        <SafeText style={styles.saveText}>{t('common.save')}</SafeText>
      </TouchableOpacity>

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
        }}
        onCancel={() => {
          setDatePickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 100,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  saveBtn: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.recovery,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: '#000',
  },
  disabled: {
    opacity: 0.5,
  },
});
