import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  Animated,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../components/common/SafeText';
import { TimePicker } from '../../components/TimePicker';
import { Section } from '../../components/common/Section';
import { HelperText } from '../../components/common/HelperText';
import { useTheme, type Theme } from '../../theme';

import { appParametersRepository } from '../../services/database/drizzle/repositories/appParametersRepository';
import { sleepEventsRepository } from '../../services/database/drizzle/repositories/sleepEventsRepository';
import { nativeSetAlarm, nativeStartNap } from '../../services/ble/nativeModule';
import { formatDuration, formatDisplayTime } from '../../utils/dateUtils';

type NapMode = 'simple' | 'smart';

const DEFAULT_DURATION_MS = 20 * 60 * 1000;

function defaultWakeUpDate(): Date {
  return new Date(Date.now() + DEFAULT_DURATION_MS);
}

function durationFromNow(wakeUpDate: Date): number {
  return Math.max(0, wakeUpDate.getTime() - Date.now());
}

/** Duration picker: a Date whose h:mm = duration in hours+minutes */
function durationAsPickerDate(ms: number): Date {
  const d = new Date();
  d.setHours(Math.floor(ms / 3600000), Math.floor((ms % 3600000) / 60000), 0, 0);
  return d;
}

export const NapSetupScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [wakeUpDate, setWakeUpDate] = useState<Date>(defaultWakeUpDate);
  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION_MS);
  const [mode, setMode] = useState<NapMode>('simple');
  const [showWakeUpPicker, setShowWakeUpPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
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

  const handleWakeUpConfirm = (date: Date) => {
    const proposedCutoff = date.getTime();
    const minCutoff = Date.now() + durationMs;
    // Only push cutoff forward if it would land before duration ends
    const resolvedCutoff = proposedCutoff > minCutoff ? proposedCutoff : minCutoff + 60_000;
    setWakeUpDate(new Date(resolvedCutoff));
    setShowWakeUpPicker(false);
  };

  const handleDurationConfirm = (date: Date) => {
    const ms = (date.getHours() * 60 + date.getMinutes()) * 60 * 1000;
    setDurationMs(ms);
    // Only push cutoff forward if duration now exceeds it
    if (Date.now() + ms > wakeUpDate.getTime()) {
      setWakeUpDate(new Date(Date.now() + ms + 60_000));
    }
    setShowDurationPicker(false);
  };

  const handleStart = async () => {
    if (saving || !loaded) return;
    setSaving(true);
    try {
      const nowMs = Date.now();
      const date = new Date(nowMs).toISOString().slice(0, 10);
      const alarmSec = Math.floor(wakeUpDate.getTime() / 1000);

      if (mode === 'simple') {
        await appParametersRepository.set('nap_mode', 'manual');
        await appParametersRepository.set('nap_active_duration_ms', durationFromNow(wakeUpDate));
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
        await appParametersRepository.set('nap_mode', 'auto');
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
          is_manual: 3,
          sleep_score: null,
          timezone: null,
        });

        await nativeSetAlarm(alarmSec);
        await nativeStartNap();
      }

      void queryClient.invalidateQueries({ queryKey: ['napState'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      navigation.goBack();
    } catch {
      Alert.alert(t('nap.errorTitle'), t('nap.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  const { hours, minutes, ampm } = formatDisplayTime(wakeUpDate);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero wake-up time */}
        <Section title={t('nap.wakeUpBy')}>
          <HelperText translationKey="nap.wakeUpHelper" />
          <TouchableOpacity
            style={styles.timeHero}
            activeOpacity={0.7}
            onPress={() => {
              setShowWakeUpPicker(true);
            }}
          >
            <View style={styles.timeRow}>
              <SafeText style={styles.timeDigits}>
                {hours}:{minutes}
              </SafeText>
              <SafeText style={styles.timeAmPm}>{ampm}</SafeText>
            </View>
            <View style={styles.editHint}>
              <Ionicons name="pencil-outline" size={12} color={theme.colors.text.muted} />
              <SafeText style={styles.editHintText}>{t('common.tap')}</SafeText>
            </View>
          </TouchableOpacity>
        </Section>

        {/* Smart toggle */}
        <Section title={t('nap.modeSmart')}>
          <View style={styles.modeRow}>
            <View style={styles.modeLabelCol}>
              <SafeText style={styles.modeDesc}>
                {mode === 'smart' ? t('nap.modeSmartDesc') : t('nap.modeSimpleDesc')}
              </SafeText>
            </View>
            <Switch
              value={mode === 'smart'}
              onValueChange={handleModeToggle}
              trackColor={{ false: theme.colors.overlay.light, true: theme.colors.sleep }}
              thumbColor={theme.colors.thumb}
            />
          </View>
        </Section>

        {/* Duration — only shown for smart, auto-calculated for simple */}
        <Animated.View style={{ opacity: smartOpacity }}>
          <Section title={t('nap.duration')}>
            <HelperText translationKey="nap.durationHelper" />
            <TouchableOpacity
              style={styles.durationRow}
              activeOpacity={0.7}
              onPress={() => {
                if (mode === 'smart') setShowDurationPicker(true);
              }}
            >
              <SafeText style={styles.durationText}>{formatDuration(durationMs)}</SafeText>
              <Ionicons name="pencil-outline" size={14} color={theme.colors.text.muted} />
            </TouchableOpacity>
          </Section>
        </Animated.View>
      </ScrollView>

      {/* Start button */}
      <TouchableOpacity
        style={[styles.startBtn, { marginBottom: insets.bottom + 16 }, saving && styles.disabled]}
        onPress={() => {
          void handleStart();
        }}
        activeOpacity={0.7}
        disabled={saving}
      >
        <SafeText style={styles.startText}>{t('nap.start')}</SafeText>
      </TouchableOpacity>

      <TimePicker
        time={wakeUpDate}
        onTimeChange={_date => {
          /* controlled via onConfirm */
        }}
        open={showWakeUpPicker}
        onCancel={() => {
          setShowWakeUpPicker(false);
        }}
        onConfirm={handleWakeUpConfirm}
      />

      <TimePicker
        time={durationAsPickerDate(durationMs)}
        onTimeChange={_date => {
          /* controlled via onConfirm */
        }}
        open={showDurationPicker}
        onCancel={() => {
          setShowDurationPicker(false);
        }}
        onConfirm={handleDurationConfirm}
      />
    </View>
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
      gap: theme.spacing.xs,
    },
    editHintText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
    modeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
    },
    modeLabelCol: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    modeDesc: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.muted,
    },
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.overlay.light,
    },
    durationText: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    startBtn: {
      margin: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.sleep,
      alignItems: 'center',
    },
    startText: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.icon.onLight,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
