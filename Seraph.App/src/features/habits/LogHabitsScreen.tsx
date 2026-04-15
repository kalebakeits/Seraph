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
import { HabitRow } from './components/HabitRow';
import { useActiveHabitsForDate } from './hooks/useActiveHabitsForDate';
import { useHabitLogs } from './hooks/useHabitLogs';
import { habitLogsRepository } from '../../services/database/drizzle';
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Date row */}
      <TouchableOpacity
        style={styles.dateRow}
        onPress={() => {
          setDatePickerOpen(true);
        }}
        activeOpacity={0.7}
      >
        <SafeText style={styles.dateLabel}>{t('habits.date')}</SafeText>
        <View style={styles.datePill}>
          <SafeText style={styles.dateValue}>{dateLabel}</SafeText>
          <Ionicons name="chevron-down" size={14} color={theme.colors.text.muted} />
        </View>
      </TouchableOpacity>

      {/* Choose habits link */}
      <TouchableOpacity
        style={styles.chooseBtn}
        onPress={() => {
          navigation.navigate('ChooseHabits' as never);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={16} color={theme.colors.recovery} />
        <SafeText style={styles.chooseBtnText}>{t('habits.chooseHabits')}</SafeText>
      </TouchableOpacity>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <SafeText style={styles.emptyTitle}>{t('habits.noActiveHabits')}</SafeText>
          <SafeText style={styles.emptyHint}>{t('habits.noActiveHabitsHint')}</SafeText>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {habits.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              value={valueFor(habit.id)}
              onChange={handleChange}
            />
          ))}
        </ScrollView>
      )}

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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  dateLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  chooseBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.recovery,
    fontWeight: theme.typography.weights.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  saveBtn: {
    margin: theme.spacing.lg,
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
