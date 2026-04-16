import React, { useState } from 'react';
import { Alert, Modal, View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../../../components/common/SafeText';
import { TimePicker } from '../../../../components/TimePicker';
import { BlockingOverlay } from '../../../../components/BlockingOverlay';
import { theme } from '../../../../theme';
import {
  sleepEventsRepository,
  activityEventsRepository,
} from '../../../../services/database/drizzle';
import { r24Repository } from '../../../../services/database/drizzle/repositories/r24Repository';
import { nativeRecalcSleep, nativeRecalcActivity } from '../../../../services/ble/nativeModule';
import { applyTimeToDate, bucketHR } from './activitySheetUtils';
import { formatTime } from '../../../../utils/dateUtils';

import { ActivityType } from '../../../../types/ActivityType';

type ItemType = ActivityType.Sleep | ActivityType.Workout;

interface LogActivitySheetProps {
  selectedDate: string;
  initialType?: ItemType;
  onClose: () => void;
}

export const LogActivitySheet: React.FC<LogActivitySheetProps> = ({
  selectedDate,
  initialType,
  onClose,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const baseDate = new Date(selectedDate + 'T00:00:00');
  const defaultStart = new Date(baseDate);
  defaultStart.setHours(22, 0, 0, 0);
  const defaultEnd = new Date(baseDate);
  defaultEnd.setHours(23, 0, 0, 0);

  const [type] = useState<ItemType>(initialType ?? ActivityType.Workout);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStartConfirm = (picker: Date) => {
    let newStart = applyTimeToDate(startDate, picker);
    if (newStart >= endDate) newStart = new Date(endDate.getTime() - 60 * 60 * 1000);
    setStartDate(newStart);
    setStartPickerOpen(false);
  };

  const handleEndConfirm = (picker: Date) => {
    let newEnd = applyTimeToDate(endDate, picker);
    if (newEnd <= startDate) newEnd = new Date(startDate.getTime() + 60 * 60 * 1000);
    setEndDate(newEnd);
    setEndPickerOpen(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const startTs = startDate.getTime();
      const endTs = endDate.getTime();

      if (type === ActivityType.Sleep) {
        if (await sleepEventsRepository.hasOverlap(startTs, endTs)) {
          Alert.alert(t('sleep.overlapTitle'), t('sleep.overlapMessage'));
          return;
        }
      } else {
        if (await activityEventsRepository.hasOverlap(startTs, endTs)) {
          Alert.alert(t('activities.overlapTitle'), t('activities.overlapMessage'));
          return;
        }
      }
      const durationMinutes = Math.round((endTs - startTs) / 60000);

      const samples = await r24Repository.getRange(startTs, endTs);

      const bucketMs = type === ActivityType.Sleep ? 120_000 : 15_000;
      const hrSamples = bucketHR(samples, bucketMs);
      const hrs = samples.map(s => s.heart_rate).filter(h => h > 0);
      const avgHr = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null;
      const maxHr = hrs.length > 0 ? Math.max(...hrs) : null;

      if (type === ActivityType.Sleep) {
        const insertedId = await sleepEventsRepository.insert({
          date: selectedDate,
          start_ts: startTs,
          end_ts: endTs,
          duration_minutes: durationMinutes,
          awake_minutes: 0,
          pending_awake_ms: 0,
          avg_hr: avgHr,
          hrv_rmssd: null,
          hr_samples: hrSamples,
          finalized: 0,
          is_manual: 1,
          sleep_score: null,
          stage_samples: '',
          timezone: null,
        });
        void nativeRecalcSleep(insertedId);
        void queryClient.invalidateQueries({ queryKey: ['activities'] });
        void queryClient.invalidateQueries({ queryKey: ['recentSleep'] });
        void queryClient.invalidateQueries({ queryKey: ['sleepEvents'] });
        void queryClient.invalidateQueries({ queryKey: ['dayStress'] });
      } else {
        const insertedActivityId = await activityEventsRepository.insert({
          date: selectedDate,
          start_ts: startTs,
          end_ts: endTs,
          duration_minutes: durationMinutes,
          avg_hr: avgHr,
          max_hr: maxHr,
          steps: null,
          hr_sum: 0,
          hr_count: 0,
          type: 'Workout',
          hr_samples: hrSamples,
          zone_seconds: null,
          threshold_hr: null,
          trimp: null,
          finalized: 0,
          is_manual: 1,
          timezone: null,
        });
        void nativeRecalcActivity(insertedActivityId);
        void queryClient.invalidateQueries({ queryKey: ['activities'] });
        void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
        void queryClient.invalidateQueries({ queryKey: ['dayStress'] });
      }

      onClose();
    } catch (e) {
      console.error('[LogActivitySheet] save failed', e);
    } finally {
      setSaving(false);
    }
  };

  const accentColor = type === ActivityType.Sleep ? theme.colors.sleep : theme.colors.active;

  return (
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <Pressable
            style={styles.sheet}
            onPress={e => {
              e.stopPropagation();
            }}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons
                  name={type === ActivityType.Sleep ? 'moon-outline' : 'barbell-outline'}
                  size={18}
                  color={accentColor}
                />
                <SafeText style={[styles.title, { color: accentColor }]}>
                  {type === ActivityType.Sleep
                    ? t('activities.logSleep')
                    : t('activities.logWorkout')}
                </SafeText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Time pickers */}
            <TouchableOpacity
              style={styles.editRow}
              onPress={() => {
                setStartPickerOpen(true);
              }}
              activeOpacity={0.7}
            >
              <SafeText style={styles.editLabel}>{t('workout.start')}</SafeText>
              <SafeText style={styles.editValue}>{formatTime(startDate.getTime())}</SafeText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editRow}
              onPress={() => {
                setEndPickerOpen(true);
              }}
              activeOpacity={0.7}
            >
              <SafeText style={styles.editLabel}>{t('workout.end')}</SafeText>
              <SafeText style={styles.editValue}>{formatTime(endDate.getTime())}</SafeText>
            </TouchableOpacity>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
                disabled={saving}
              >
                <SafeText style={styles.cancelText}>{t('common.cancel')}</SafeText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: accentColor },
                  saving && styles.disabled,
                ]}
                onPress={() => {
                  void handleSave();
                }}
                activeOpacity={0.7}
                disabled={saving}
              >
                <SafeText style={styles.saveText}>{t('workout.save')}</SafeText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </TouchableOpacity>

        <TimePicker
          time={startDate}
          onTimeChange={setStartDate}
          open={startPickerOpen}
          onConfirm={handleStartConfirm}
          onCancel={() => {
            setStartPickerOpen(false);
          }}
          mode="datetime"
        />
        <TimePicker
          time={endDate}
          onTimeChange={setEndDate}
          open={endPickerOpen}
          onConfirm={handleEndConfirm}
          onCancel={() => {
            setEndPickerOpen(false);
          }}
          mode="datetime"
        />
      </Modal>

      <BlockingOverlay visible={saving} />
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
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  editLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  editValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.overlay.light,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  saveBtn: {
    flex: 1,
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
