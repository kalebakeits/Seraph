import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { TimePicker } from '../../components/TimePicker';
import { useTheme, type Theme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle';
import { nativeRecalculateCurrentSleepNeed } from '../../services/ble/nativeModule';
import { useBaselines } from '../../hooks/useBaselines';
import type { AppParameter } from '../../services/database/drizzle/repositories/appParametersRepository';
import { minutesToDate } from '../../utils/dateUtils';
import { DobDatePicker } from './components/DobDatePicker';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import type { PersonalInfoState } from './sections/PersonalInfoSection';
import { BaselinesSection } from './sections/BaselinesSection';
import type { ProfileState } from './SettingsTypes';
import { dobToAge } from './SettingsTypes';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: baselines } = useBaselines();

  const [state, setState] = useState<ProfileState>({
    name: '',
    dob: '',
    sex: '',
    height_cm: '',
    weight_kg: '',
    sleep_goal_minutes: 480,
    fthr: '',
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    void (async () => {
      const keys: AppParameter[] = [
        'profile_name',
        'profile_dob',
        'profile_sex',
        'profile_height_cm',
        'profile_weight_kg',
        'profile_sleep_goal_minutes',
        'profile_threshold_hr',
      ];
      const values = await Promise.all(keys.map(k => appParametersRepository.get(k)));
      const [name, dob, sex, height, weight, sleepGoal, fthr] = values;
      setState(s => ({
        ...s,
        name: name ?? '',
        dob: dob ?? '',
        sex: sex as ProfileState['sex'],
        height_cm: height ?? '',
        weight_kg: weight ?? '',
        sleep_goal_minutes: sleepGoal ? parseInt(sleepGoal, 10) : 480,
        fthr: fthr ?? '',
      }));
    })();
  }, []);

  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveRef.current) {
        clearTimeout(saveRef.current);
      }
    };
  }, []);

  const persist = useCallback(
    async (patch: Partial<ProfileState>) => {
      const merged = { ...state, ...patch };
      const age = dobToAge(merged.dob);

      const entries: [AppParameter, string][] = [
        ['profile_name', merged.name],
        ['profile_dob', merged.dob],
        ['profile_sex', merged.sex],
        ['profile_height_cm', merged.height_cm],
        ['profile_weight_kg', merged.weight_kg],
        ['profile_sleep_goal_minutes', String(merged.sleep_goal_minutes)],
        ['profile_threshold_hr', merged.fthr],
      ];
      if (age !== null) entries.push(['profile_age', String(age)]);

      await Promise.all(
        entries.filter(([, v]) => v !== '').map(([k, v]) => appParametersRepository.set(k, v)),
      );

      if (patch.sleep_goal_minutes !== undefined) {
        void nativeRecalculateCurrentSleepNeed().catch(() => {
          // best-effort; native aggregation will refresh on the next sync
        });
      }

      void queryClient.invalidateQueries({ queryKey: ['sleepGoal'] });
      void queryClient.invalidateQueries({ queryKey: ['sleepNeedFactors'] });
      void queryClient.invalidateQueries({ queryKey: ['baselines'] });
    },
    [state, queryClient],
  );

  const setField = <K extends keyof ProfileState>(
    key: K,
    value: ProfileState[K],
    immediate = false,
  ) => {
    setState(s => ({ ...s, [key]: value }));
    if (saveRef.current) clearTimeout(saveRef.current);
    const patch = { [key]: value } as Partial<ProfileState>;
    if (immediate) {
      void persist(patch);
    } else {
      saveRef.current = setTimeout(() => {
        void persist(patch);
      }, 800);
    }
  };

  const setPersonalInfoField = <K extends keyof PersonalInfoState>(
    key: K,
    value: PersonalInfoState[K],
    immediate = false,
  ) => {
    setField(key, value as ProfileState[K], immediate);
  };

  const dobDisplay = state.dob
    ? new Date(state.dob + 'T12:00:00Z').toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : '—';
  const sleepGoalDate = minutesToDate(state.sleep_goal_minutes);
  const sleepDisplay = `${String(Math.floor(state.sleep_goal_minutes / 60)).padStart(
    2,
    '0',
  )}:${String(state.sleep_goal_minutes % 60).padStart(2, '0')}`;

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PersonalInfoSection
          state={state}
          dobDisplay={dobDisplay}
          sleepDisplay={sleepDisplay}
          onFieldChange={(key, value) => {
            setPersonalInfoField(key, value);
          }}
          onFieldChangeImmediate={(key, value) => {
            setPersonalInfoField(key, value, true);
          }}
          onShowCalendar={() => {
            setShowDobPicker(true);
          }}
          onShowTimePicker={() => {
            setShowTimePicker(true);
          }}
        />

        <BaselinesSection baselines={baselines} />

        <View style={{ height: theme.spacing.xxl }} />
      </ScreenLayout>

      <DobDatePicker
        dob={state.dob}
        open={showDobPicker}
        onConfirm={iso => {
          setField('dob', iso, true);
          setShowDobPicker(false);
        }}
        onCancel={() => {
          setShowDobPicker(false);
        }}
      />

      {/* Time picker for sleep goal */}
      <TimePicker
        time={sleepGoalDate}
        onTimeChange={() => {
          /* empty */
        }}
        open={showTimePicker}
        onCancel={() => {
          setShowTimePicker(false);
        }}
        onConfirm={(date: Date) => {
          const mins = date.getHours() * 60 + date.getMinutes();
          setShowTimePicker(false);
          setField('sleep_goal_minutes', mins, true);
        }}
      />
    </GradientBackground>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xs,
    },
  });
}
