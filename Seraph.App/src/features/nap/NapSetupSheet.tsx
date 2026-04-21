import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Switch,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../components/common/SafeText';
import { TimePicker } from '../../components/TimePicker';
import { theme } from '../../theme';
import { formatDuration, formatTime } from '../../utils/dateUtils';
import { appParametersRepository } from '../../services/database/drizzle/repositories/appParametersRepository';
import { sleepEventsRepository } from '../../services/database/drizzle/repositories/sleepEventsRepository';
import { nativeSetAlarm, nativeStartNap } from '../../services/ble/nativeModule';

type NapMode = 'simple' | 'smart';

const DEFAULT_DURATION_MS = 20 * 60 * 1000;
const DEFAULT_CUTOFF_BUFFER_MS = 30 * 60 * 1000;

function defaultCutoffDate(durationMs: number): Date {
  return new Date(Date.now() + durationMs + DEFAULT_CUTOFF_BUFFER_MS);
}

/** Round ms to the nearest minute for display */
function snapToMinute(ms: number): number {
  return Math.round(ms / 60000) * 60000;
}

interface NapSetupSheetProps {
  onClose: () => void;
}

export const NapSetupSheet: React.FC<NapSetupSheetProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION_MS);
  const [mode, setMode] = useState<NapMode>('simple');
  const [cutoffDate, setCutoffDate] = useState<Date>(() => defaultCutoffDate(DEFAULT_DURATION_MS));
  const [pickerDate, setPickerDate] = useState<Date>(() => defaultCutoffDate(DEFAULT_DURATION_MS));
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCutoffPicker, setShowCutoffPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const smartOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void appParametersRepository.get('nap_default_mode').then(saved => {
      const resolved: NapMode = saved === 'smart' ? 'smart' : 'simple';
      setMode(resolved);
      if (resolved === 'smart') smartOpacity.setValue(1);
      setLoaded(true);
    });
  }, [smartOpacity]);

  const handleModeToggle = (value: boolean) => {
    const next: NapMode = value ? 'smart' : 'simple';
    setMode(next);
    void appParametersRepository.set('nap_default_mode', next);
    Animated.timing(smartOpacity, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleDurationConfirm = (date: Date) => {
    // Interpret the picked time as h:mm → duration in ms
    const ms = snapToMinute((date.getHours() * 60 + date.getMinutes()) * 60 * 1000);
    setDurationMs(ms);
    setCutoffDate(defaultCutoffDate(ms));
    setPickerDate(defaultCutoffDate(ms));
    setShowDurationPicker(false);
  };

  const handleCutoffConfirm = (date: Date) => {
    setCutoffDate(date);
    setShowCutoffPicker(false);
  };

  /** A Date whose h:mm represents the chosen duration (for the time picker). */
  const durationAsDate = (): Date => {
    const d = new Date();
    d.setHours(Math.floor(durationMs / 3600000), Math.floor((durationMs % 3600000) / 60000), 0, 0);
    return d;
  };

  const handleStart = async () => {
    if (saving || !loaded) return;
    setSaving(true);
    try {
      const nowMs = Date.now();
      const nowSec = Math.floor(nowMs / 1000);
      const date = new Date(nowMs).toISOString().slice(0, 10);

      if (mode === 'simple') {
        const alarmSec = nowSec + Math.floor(durationMs / 1000);

        await appParametersRepository.set('nap_mode', 'manual');
        await appParametersRepository.set('nap_active_duration_ms', durationMs);
        await appParametersRepository.set('nap_hard_cutoff_sec', alarmSec);

        await sleepEventsRepository.insert({
          date,
          start_ts: 0,
          end_ts: alarmSec * 1000,
          duration_minutes: 0,
          awake_minutes: 0,
          pending_awake_ms: 0,
          avg_hr: null,
          hrv_rmssd: null,
          hr_samples: '[]',
          stage_samples: '[]',
          finalized: 0,
          is_manual: 2,
          sleep_score: null,
          timezone: null,
        });

        await nativeSetAlarm(alarmSec);
      } else {
        const cutoffSec = Math.floor(cutoffDate.getTime() / 1000);

        await appParametersRepository.set('nap_mode', 'auto');
        await appParametersRepository.set('nap_active_duration_ms', durationMs);
        await appParametersRepository.set('nap_hard_cutoff_sec', cutoffSec);

        await sleepEventsRepository.insert({
          date,
          start_ts: 0,
          end_ts: cutoffSec * 1000,
          duration_minutes: 0,
          awake_minutes: 0,
          pending_awake_ms: 0,
          avg_hr: null,
          hrv_rmssd: null,
          hr_samples: '[]',
          stage_samples: '[]',
          finalized: 0,
          is_manual: 3,
          sleep_score: null,
          timezone: null,
        });

        await nativeSetAlarm(cutoffSec);
        await nativeStartNap();
      }

      void queryClient.invalidateQueries({ queryKey: ['napState'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      onClose();
    } catch {
      Alert.alert(t('nap.errorTitle'), t('nap.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={e => {
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="bed-outline" size={18} color={theme.colors.sleep} />
              <SafeText style={styles.title}>{t('nap.startNap')}</SafeText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={22} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Duration row — tappable, shows formatted duration */}
          <SafeText style={styles.rowLabel}>{t('nap.duration')}</SafeText>
          <TouchableOpacity
            style={styles.valueRow}
            activeOpacity={0.7}
            onPress={() => {
              setShowDurationPicker(true);
            }}
          >
            <SafeText style={styles.valueText}>{formatDuration(durationMs)}</SafeText>
            <Ionicons name="pencil-outline" size={14} color={theme.colors.text.muted} />
          </TouchableOpacity>

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <View style={styles.modeLabelCol}>
              <SafeText style={styles.rowLabel}>{t('nap.modeSmart')}</SafeText>
              <SafeText style={styles.modeDesc}>
                {mode === 'smart' ? t('nap.modeSmartDesc') : t('nap.modeSimpleDesc')}
              </SafeText>
            </View>
            <Switch
              value={mode === 'smart'}
              onValueChange={handleModeToggle}
              trackColor={{ false: theme.colors.overlay.light, true: theme.colors.sleep }}
              thumbColor="#fff"
            />
          </View>

          {/* Wake up by — fades in when smart is on */}
          <Animated.View style={{ opacity: smartOpacity }}>
            <TouchableOpacity
              style={styles.valueRow}
              activeOpacity={0.7}
              onPress={() => {
                if (mode === 'smart') setShowCutoffPicker(true);
              }}
            >
              <SafeText style={styles.rowLabel}>{t('nap.wakeUpBy')}</SafeText>
              <View style={styles.cutoffRight}>
                <SafeText style={styles.cutoffTime}>
                  {formatTime(cutoffDate.getTime(), i18n.language)}
                </SafeText>
                <Ionicons name="pencil-outline" size={14} color={theme.colors.text.muted} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Buttons */}
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
              style={[styles.startBtn, saving && styles.disabled]}
              onPress={() => {
                void handleStart();
              }}
              activeOpacity={0.7}
              disabled={saving}
            >
              <SafeText style={styles.startText}>{t('nap.start')}</SafeText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </TouchableOpacity>

      {/* Duration picker — h:mm interpreted as duration */}
      <TimePicker
        time={durationAsDate()}
        onTimeChange={setPickerDate}
        open={showDurationPicker}
        onCancel={() => {
          setShowDurationPicker(false);
        }}
        onConfirm={handleDurationConfirm}
      />

      {/* Cutoff time picker */}
      <TimePicker
        time={pickerDate}
        onTimeChange={setPickerDate}
        open={showCutoffPicker}
        onCancel={() => {
          setShowCutoffPicker(false);
        }}
        onConfirm={handleCutoffConfirm}
      />
    </Modal>
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
    color: theme.colors.sleep,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  rowLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  valueText: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  modeLabelCol: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  modeDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  cutoffRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cutoffTime: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.sleep,
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
  startBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.sleep,
    alignItems: 'center',
  },
  startText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: '#000',
  },
  disabled: {
    opacity: 0.5,
  },
});
