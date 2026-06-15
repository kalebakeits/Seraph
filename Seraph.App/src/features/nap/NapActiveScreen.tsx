import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeText } from '../../components/common/SafeText';
import { ActivityRing } from '../../components/common/ActivityRing';
import { GradientBackground } from '../../components/common/GradientBackground';
import { NapSaveDiscardSheet } from './NapSaveDiscardSheet';
import { useNapState } from './hooks/useNapState';
import { appParametersRepository } from '../../services/database/drizzle/repositories/appParametersRepository';
import { sleepEventsRepository } from '../../services/database/drizzle/repositories/sleepEventsRepository';
import { nativeCancelNap, nativeRecalcSleep, seraphEmitter } from '../../services/ble/nativeModule';
import { syncAlarmToDevice } from '../../services/alarm/syncAlarmToDevice';
import { formatDuration } from '../../utils/dateUtils';
import { useTheme, type Theme } from '../../theme';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'NapActive'>;

export const NapActiveScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { napState, refetchNapState } = useNapState();

  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [elapsedSleepMs, setElapsedSleepMs] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sleepStartRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!napState.active && !sheetOpen) {
      navigation.goBack();
    }
  }, [napState.active, sheetOpen, navigation]);

  // Seed sleep start from napState on mount (reconnect / revisit)
  useEffect(() => {
    const ts = napState.sleepStartTs ?? 0;
    sleepStartRef.current = ts;
    if (ts > 0) setElapsedSleepMs(Date.now() - ts);
  }, [napState.sleepStartTs]);

  // Listen for onset event pushed from native
  useEffect(() => {
    const sub = seraphEmitter.addListener('onNapSleepOnset', (e: { startTs: number }) => {
      sleepStartRef.current = e.startTs;
      setElapsedSleepMs(Date.now() - e.startTs);
      void refetchNapState();
    });
    return () => {
      sub.remove();
    };
  }, [refetchNapState]);

  // Countdown to hard cutoff + live elapsed sleep
  useEffect(() => {
    if (!napState.hardCutoffSec) return;
    const cutoff = napState.hardCutoffSec;
    const tick = () => {
      setRemainingSec(Math.max(0, cutoff - Math.floor(Date.now() / 1000)));
      if (sleepStartRef.current > 0) setElapsedSleepMs(Date.now() - sleepStartRef.current);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [napState.hardCutoffSec]);

  const clearNapDb = useCallback(async () => {
    await appParametersRepository.delete('nap_active_duration_ms');
    await appParametersRepository.delete('nap_hard_cutoff_sec');
    await appParametersRepository.delete('nap_mode');
  }, []);

  const handleSave = useCallback(async () => {
    setSheetOpen(false);
    try {
      const nap = await sleepEventsRepository.getActiveNap();
      await clearNapDb();
      if (napState.mode === 'auto') await nativeCancelNap();
      await syncAlarmToDevice();
      void queryClient.invalidateQueries({ queryKey: ['napState'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      if (nap) {
        await sleepEventsRepository.markFinalized(nap.id);
        void nativeRecalcSleep(nap.id);
        const date = new Date().toISOString().slice(0, 10);
        navigation.replace('SleepSessionDetail', { sleepId: nap.id, selectedDate: date });
      } else {
        navigation.goBack();
      }
    } catch {
      navigation.goBack();
    }
  }, [clearNapDb, napState.mode, navigation, queryClient]);

  const handleDiscard = useCallback(async () => {
    setSheetOpen(false);
    try {
      const nap = await sleepEventsRepository.getActiveNap();
      await clearNapDb();
      if (napState.mode === 'auto') await nativeCancelNap();
      await syncAlarmToDevice();
      if (nap) await sleepEventsRepository.delete(nap.id);
      void queryClient.invalidateQueries({ queryKey: ['napState'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch {
      // ignore
    }
    navigation.goBack();
  }, [clearNapDb, napState.mode, navigation, queryClient]);

  const sleepStarted = sleepStartRef.current > 0;
  const ringValue =
    sleepStarted && napState.targetMs ? Math.min(1, elapsedSleepMs / napState.targetMs) : 0;
  const modeLabel = napState.mode === 'auto' ? t('nap.smartNapActive') : t('nap.simpleNapActive');

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.modePill}>
            <Ionicons name="moon" size={14} color={theme.colors.sleep} />
            <SafeText style={styles.modeLabel}>{modeLabel}</SafeText>
          </View>
        </View>

        <View style={styles.body}>
          <ActivityRing
            value={ringValue}
            goal={1}
            size={120}
            strokeWidth={8}
            color={theme.colors.sleep}
            label={t('nap.progressLabel')}
            decimals={0}
          />

          <View style={styles.timerSection}>
            <SafeText style={styles.timer}>
              {remainingSec !== null ? formatDuration(remainingSec * 1000, 'seconds') : '--'}
            </SafeText>
            <SafeText style={styles.timerLabel}>{t('nap.alarmLabel')}</SafeText>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => {
              setSheetOpen(true);
            }}
            style={styles.endBtn}
            activeOpacity={0.7}
          >
            <SafeText style={styles.endText}>{t('nap.endNap')}</SafeText>
          </TouchableOpacity>
        </View>

        <NapSaveDiscardSheet
          visible={sheetOpen}
          onSave={() => void handleSave()}
          onDiscard={() => void handleDiscard()}
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1 },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'flex-start',
    },
    modePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.smx,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.sleep.light,
      backgroundColor: theme.colors.overlay.faint,
    },
    modeLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.sleep,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xl,
    },
    timerSection: { alignItems: 'center', gap: theme.spacing.xs },
    timer: {
      fontSize: 52,
      fontWeight: '700',
      color: theme.colors.text.primary,
      letterSpacing: -1,
    },
    timerLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    controls: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    endBtn: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.sleep.medium,
      backgroundColor: theme.colors.overlay.faint,
    },
    endText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.sleep,
    },
  });
}
