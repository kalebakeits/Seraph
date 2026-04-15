import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmPreferences } from './hooks/useAlarmPreferences';
import { TimePicker } from '../../components/TimePicker';
import { syncAlarmToDevice } from '../../services/alarm/syncAlarmToDevice';
import { SafeText } from '../../components/common/SafeText';
import { Section } from '../../components/common/Section';
import { HelperText } from '../../components/common/HelperText';
import { theme } from '../../theme';
import type { AlarmMode } from '../../services/database/userPreferences/alarmPreferences';

const MODES: { key: AlarmMode; labelKey: string }[] = [
  { key: 'disabled', labelKey: 'alarm.off' },
  { key: 'single', labelKey: 'alarm.once' },
  { key: 'schedule', labelKey: 'alarm.schedule' },
];

const DAY_KEYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDisplayTime(time: string): { hours: string; minutes: string; ampm: string } {
  const date = timeStringToDate(time);
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hours = String(h % 12 || 12);
  const minutes = String(m).padStart(2, '0');
  return { hours, minutes, ampm };
}

export const WakeUpScreen: React.FC = () => {
  const { t } = useTranslation();
  const { alarmTime, alarmMode, alarmSchedule, updateTime, updateMode, updateSchedule, isLoading } =
    useAlarmPreferences();

  const [pendingTime, setPendingTime] = useState(alarmTime);
  const [pendingMode, setPendingMode] = useState<AlarmMode>(alarmMode);
  const [pendingSchedule, setPendingSchedule] = useState(alarmSchedule);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(() => timeStringToDate(alarmTime));
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setPendingTime(alarmTime);
      setPendingMode(alarmMode);
      setPendingSchedule(alarmSchedule);
      setPickerTime(timeStringToDate(alarmTime));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const scheduleAutoSave = useCallback(
    (time: string, mode: AlarmMode, schedule: number[]) => {
      if (saveRef.current) clearTimeout(saveRef.current);
      saveRef.current = setTimeout(() => {
        updateTime(time);
        updateMode(mode);
        updateSchedule(schedule);
        void syncAlarmToDevice();
      }, 600);
    },
    [updateTime, updateMode, updateSchedule],
  );

  const handleTimeConfirm = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const newTime = `${h}:${m}`;
    setPendingTime(newTime);
    setShowPicker(false);
    scheduleAutoSave(newTime, pendingMode, pendingSchedule);
  };

  const handleModeChange = (mode: AlarmMode) => {
    setPendingMode(mode);
    scheduleAutoSave(pendingTime, mode, pendingSchedule);
  };

  const handleToggleDay = (i: number) => {
    const next = [...pendingSchedule];
    next[i] = next[i] === 1 ? 0 : 1;
    setPendingSchedule(next);
    scheduleAutoSave(pendingTime, pendingMode, next);
  };

  const { hours, minutes, ampm } = formatDisplayTime(pendingTime);
  const isEnabled = pendingMode !== 'disabled';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero time ── */}
        <Section title={t('alarm.wakeTime')}>
          <HelperText translationKey="alarm.screenHelper" />
          <TouchableOpacity
            style={styles.timeHero}
            activeOpacity={0.7}
            onPress={() => {
              setShowPicker(true);
            }}
          >
            <View style={styles.timeRow}>
              <SafeText style={[styles.timeDigits, !isEnabled && styles.dimmed]}>
                {hours}:{minutes}
              </SafeText>
              <SafeText style={[styles.timeAmPm, !isEnabled && styles.dimmed]}>{ampm}</SafeText>
            </View>
            <View style={styles.editHint}>
              <Ionicons name="pencil-outline" size={12} color={theme.colors.text.muted} />
              <SafeText style={styles.editHintText}>{t('common.tap')}</SafeText>
            </View>
          </TouchableOpacity>
        </Section>

        {/* ── Mode segmented control ── */}
        <Section title={t(`alarm.modeLabel.${pendingMode}`)}>
          <HelperText translationKey={`alarm.modeDesc.${pendingMode}`} />
          <View style={styles.segmented}>
            {MODES.map((m, idx) => {
              const active = pendingMode === m.key;
              return (
                <Pressable
                  key={m.key}
                  style={[
                    styles.segment,
                    idx === 0 && styles.segmentFirst,
                    idx === MODES.length - 1 && styles.segmentLast,
                    active && styles.segmentActive,
                  ]}
                  onPress={() => {
                    handleModeChange(m.key);
                  }}
                >
                  <SafeText style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {t(m.labelKey)}
                  </SafeText>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Schedule day picker ── */}
        {pendingMode === 'schedule' && (
          <Section title={t('alarm.activeDays')}>
            <HelperText translationKey="alarm.activeDaysHelper" />
            <View style={styles.daysRow}>
              {DAY_KEYS.map((day, i) => {
                const active = pendingSchedule[i] === 1;
                return (
                  <Pressable
                    key={day}
                    style={[styles.dayCircle, active && styles.dayCircleActive]}
                    onPress={() => {
                      handleToggleDay(i);
                    }}
                    hitSlop={4}
                  >
                    <SafeText style={[styles.dayText, active && styles.dayTextActive]}>
                      {day}
                    </SafeText>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        )}
      </ScrollView>

      <TimePicker
        time={pickerTime}
        onTimeChange={setPickerTime}
        open={showPicker}
        onCancel={() => {
          setShowPicker(false);
        }}
        onConfirm={handleTimeConfirm}
      />
    </View>
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
    paddingBottom: theme.tabStyles.content.paddingBottom,
    gap: theme.spacing.lg,
  },
  // Hero time display
  timeHero: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  timeDigits: {
    fontSize: 72,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    letterSpacing: -2,
    lineHeight: 80,
  },
  timeAmPm: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    paddingBottom: theme.spacing.sm,
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editHintText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  dimmed: {
    opacity: 0.3,
  },
  // Segmented control
  segmented: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  segmentFirst: {},
  segmentLast: {
    borderRightWidth: 0,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary + '33',
  },
  segmentText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.weights.medium,
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  // Day circles
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '22',
  },
  dayText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.muted,
  },
  dayTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
});
