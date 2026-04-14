import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-native-date-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeText } from '../../components/common/SafeText';
import { HabitRow } from './components/HabitRow';
import { useActiveHabits } from './hooks/useActiveHabits';
import { useHabitLogs } from './hooks/useHabitLogs';
import { habitLogsRepository } from '../../services/database/drizzle';
import { navigationRef } from '../../navigation/navigationRef';
import { theme } from '../../theme';

interface LogHabitsSheetProps {
  selectedDate: string;
  onClose: () => void;
}

function dateFromISO(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function isoFromDate(date: Date): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const LogHabitsSheet: React.FC<LogHabitsSheetProps> = ({ selectedDate, onClose }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const today = isoFromDate(new Date());
  const [date, setDate] = useState(selectedDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<Record<number, number | null>>({});

  const { data: habits = [] } = useActiveHabits();
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
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const dateLabel =
    date === today
      ? t('common.today')
      : dateFromISO(date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  return (
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={e => {
              e.stopPropagation();
            }}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons name="journal-outline" size={18} color={theme.colors.recovery} />
                <SafeText style={styles.title}>{t('habits.logHabits')}</SafeText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

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

            <TouchableOpacity
              style={styles.chooseBtn}
              onPress={() => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate('ChooseHabits' as never);
                }
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
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
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
              style={[styles.saveBtn, saving && styles.disabled]}
              onPress={() => {
                void handleSave();
              }}
              activeOpacity={0.7}
              disabled={saving}
            >
              <SafeText style={styles.saveText}>{t('common.save')}</SafeText>
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>

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
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.surface.sheet,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  chooseBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.recovery,
    fontWeight: theme.typography.weights.semibold,
  },
  list: {
    marginBottom: theme.spacing.md,
  },
  empty: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  saveBtn: {
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
