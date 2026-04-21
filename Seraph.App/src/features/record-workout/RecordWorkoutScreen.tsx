import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { errorMessage } from '../../utils/errorUtils';
import { Alert, ScrollView, StyleSheet, View, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { ActivityRing } from '../../components/common/ActivityRing';
import { GradientBackground } from '../../components/common/GradientBackground';
import { LiveHRDisplay } from './components/LiveHRDisplay';
import { WorkoutControls } from './components/WorkoutControls';
import { RecordWorkoutHeader } from './components/RecordWorkoutHeader';
import { SportPicker } from './components/SportPicker';
import { SaveDiscardSheet } from './SaveDiscardSheet';
import { ZoneBar } from './ZoneBar';
import { useRealtimeHR } from './hooks/useRealtimeHR';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { useLiveStrain } from './hooks/useLiveStrain';
import { useAutoPauseSettings } from './hooks/useAutoPauseSettings';
import { AutoPausePanel } from './components/AutoPausePanel';
import { useTheme, type Theme } from '../../theme';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { activityEventsRepository } from '../../services/database/drizzle/repositories/activityEventsRepository';
import { appParametersRepository } from '../../services/database/drizzle/repositories/appParametersRepository';
import {
  nativeStartWorkoutRecording,
  nativePauseWorkoutRecording,
  nativeResumeWorkoutRecording,
  nativeStopWorkoutRecording,
  nativeDiscardWorkoutRecording,
  seraphEmitter,
} from '../../services/ble/nativeModule';
import { formatDuration } from '../../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'RecordWorkout'>;
type RecordingPhase = 'idle' | 'recording' | 'paused' | 'auto_paused';

const STRAIN_GOAL = 21;

export const RecordWorkoutScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [sport, setSport] = useState('Workout');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [fthr, setFthr] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [recentSports, setRecentSports] = useState<string[]>([]);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const {
    settings: autoPauseSettings,
    setEnabled: setAutoPauseEnabled,
    setZ1Seconds,
  } = useAutoPauseSettings();

  const handleExitRequest = useCallback(async () => {
    if (phase === 'idle') {
      navigation.goBack();
      return;
    }

    setBusy(true);
    try {
      if (phase === 'recording' || phase === 'auto_paused') {
        await nativePauseWorkoutRecording();
        setPhase('paused');
      }
      setSaveSheetOpen(true);
    } catch {
      try {
        await nativeDiscardWorkoutRecording();
      } catch {
        // ignore
      }
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  }, [phase, navigation]);

  useEffect(() => {
    void appParametersRepository.getNumeric('profile_threshold_hr').then(val => {
      if (val != null) setFthr(val);
    });
    void appParametersRepository.getNumeric('profile_age').then(val => {
      if (val != null) setAge(val);
    });

    void activityEventsRepository.getRecentRecordedSports(3).then(setRecentSports);
  }, []);

  useEffect(() => {
    if (phase === 'idle') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void handleExitRequest();
      return true;
    });
    return () => {
      sub.remove();
    };
  }, [phase, handleExitRequest]);

  useEffect(() => {
    const sub = seraphEmitter.addListener('onWorkoutProcessed', () => {
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      void queryClient.invalidateQueries({ queryKey: ['activityRings'] });
      void queryClient.invalidateQueries({ queryKey: ['strainDetail'] });
    });
    return () => {
      sub.remove();
    };
  }, [queryClient]);

  useEffect(() => {
    const sub = seraphEmitter.addListener('onRecordingAutoPaused', () => {
      setPhase('auto_paused');
    });
    return () => {
      sub.remove();
    };
  }, []);

  const { hr, zone, zoneColor } = useRealtimeHR(fthr, age);
  const elapsedMs = useWorkoutTimer(phase === 'recording', startTs);
  const { total: liveStrain } = useLiveStrain(phase === 'recording', elapsedMs, zone);

  const handleStart = useCallback(async () => {
    setBusy(true);
    try {
      await nativeStartWorkoutRecording(sport);
      setStartTs(Date.now());
      setPhase('recording');
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [sport]);

  const handlePause = useCallback(async () => {
    setBusy(true);
    try {
      await nativePauseWorkoutRecording();
      setPhase('paused');
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const handleResume = useCallback(async () => {
    setBusy(true);
    try {
      await nativeResumeWorkoutRecording();
      setPhase('recording');
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const handleStop = useCallback(async () => {
    setBusy(true);
    try {
      if (phase === 'recording' || phase === 'auto_paused') {
        await nativePauseWorkoutRecording();
        setPhase('paused');
      }
      setSaveSheetOpen(true);
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [phase]);

  const handleSave = useCallback(async () => {
    setSaveSheetOpen(false);
    setBusy(true);
    try {
      const result = await nativeStopWorkoutRecording();

      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      void queryClient.invalidateQueries({ queryKey: ['activityRings'] });
      void queryClient.invalidateQueries({ queryKey: ['strainDetail'] });

      navigation.replace('WorkoutDetail', {
        activityId: result.activityId,
        selectedDate: result.date,
      });
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [navigation, queryClient]);

  const handleDiscard = useCallback(async () => {
    setSaveSheetOpen(false);
    try {
      await nativeDiscardWorkoutRecording();
    } catch {
      // ignore
    }
    navigation.goBack();
  }, [navigation]);

  const strainValue = liveStrain ?? 0;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <RecordWorkoutHeader
          sport={sport}
          canChangeSport={phase === 'idle'}
          onSportPress={() => {
            setPickerOpen(true);
          }}
          onClose={() => void handleExitRequest()}
          closeDisabled={busy}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.ringSection}>
            <ActivityRing
              value={strainValue}
              goal={STRAIN_GOAL}
              size={120}
              strokeWidth={8}
              color={theme.colors.strain}
              label={t('workout.liveStrain')}
              decimals={1}
            />
            {phase !== 'idle' && (
              <SafeText style={styles.prelimLabel}>{t('workout.preliminary')}</SafeText>
            )}
          </View>

          <LiveHRDisplay hr={hr} zone={zone} zoneColor={zoneColor} />

          <View style={styles.timerSection}>
            <SafeText style={styles.timer}>{formatDuration(elapsedMs, 'seconds')}</SafeText>
            <SafeText style={styles.timerLabel}>{t('workout.duration')}</SafeText>
          </View>

          {phase !== 'idle' && <ZoneBar zone={zone} />}

          <AutoPausePanel
            settings={autoPauseSettings}
            onToggle={v => void setAutoPauseEnabled(v)}
            onZ1Change={v => void setZ1Seconds(v)}
          />
        </ScrollView>

        <View style={styles.controls}>
          <WorkoutControls
            phase={phase}
            onStart={() => void handleStart()}
            onPause={() => void handlePause()}
            onResume={() => void handleResume()}
            onStop={() => void handleStop()}
            disabled={busy}
          />
        </View>

        <SportPicker
          visible={pickerOpen}
          selected={sport}
          recentSports={recentSports}
          onSelect={setSport}
          onClose={() => {
            setPickerOpen(false);
          }}
        />

        <SaveDiscardSheet
          visible={saveSheetOpen}
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
    content: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.xl,
      paddingBottom: theme.tabStyles.content.paddingBottom,
    },
    ringSection: { alignItems: 'center', gap: theme.spacing.xs },
    prelimLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      letterSpacing: 0.5,
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
  });
}
