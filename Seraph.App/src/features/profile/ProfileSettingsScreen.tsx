import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { TimePicker } from '../../components/TimePicker';
import { theme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle';
import { useBaselines } from '../../hooks/useBaselines';
import type { AppParameter } from '../../services/database/drizzle/repositories/appParametersRepository';
import { minutesToDate } from '../../utils/dateUtils';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { BaselinesSection } from './sections/BaselinesSection';
import { PreferencesSection } from './sections/PreferencesSection';
import { ActivityDetectionSection } from './sections/ActivityDetectionSection';
import { LanguageSheet } from './sections/LanguageSheet';
import type { SettingsState, SensitivityPreset } from './ProfileSettingsTypes';
import { SENSITIVITY_PRESETS, LANGUAGES, trimpToPreset, dobToAge } from './ProfileSettingsTypes';

export const ProfileSettingsScreen: React.FC = () => {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: baselines } = useBaselines();

  const [state, setState] = useState<SettingsState>({
    name: '',
    dob: '',
    sex: '',
    height_cm: '',
    weight_kg: '',
    sleep_goal_minutes: 480,
    fthr: '',
    sensitivity: 'moderate',
    language: i18n.language.slice(0, 2),
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

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
        'activity_min_trimp',
      ];
      const values = await Promise.all(keys.map(k => appParametersRepository.get(k)));
      const [name, dob, sex, height, weight, sleepGoal, fthr, minTrimp] = values;
      setState(s => ({
        ...s,
        name: name ?? '',
        dob: dob ?? '',
        sex: sex as SettingsState['sex'],
        height_cm: height ?? '',
        weight_kg: weight ?? '',
        sleep_goal_minutes: sleepGoal ? parseInt(sleepGoal, 10) : 480,
        fthr: fthr ?? '',
        sensitivity: trimpToPreset(minTrimp ? parseFloat(minTrimp) : null),
      }));
    })();
  }, []);

  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (patch: Partial<SettingsState>) => {
      const merged = { ...state, ...patch };
      const preset =
        SENSITIVITY_PRESETS.find(p => p.key === merged.sensitivity) ?? SENSITIVITY_PRESETS[2];
      const age = dobToAge(merged.dob);

      const entries: [AppParameter, string][] = [
        ['profile_name', merged.name],
        ['profile_dob', merged.dob],
        ['profile_sex', merged.sex],
        ['profile_height_cm', merged.height_cm],
        ['profile_weight_kg', merged.weight_kg],
        ['profile_sleep_goal_minutes', String(merged.sleep_goal_minutes)],
        ['profile_threshold_hr', merged.fthr],
        ['activity_min_trimp', String(preset.minTrimp)],
        ['activity_min_ms', String(preset.minMs)],
      ];
      if (age !== null) entries.push(['profile_age', String(age)]);

      await Promise.all(
        entries.filter(([, v]) => v !== '').map(([k, v]) => appParametersRepository.set(k, v)),
      );

      if (patch.language && patch.language !== i18n.language.slice(0, 2)) {
        await i18n.changeLanguage(patch.language);
      }

      void queryClient.invalidateQueries({ queryKey: ['sleepGoal'] });
      void queryClient.invalidateQueries({ queryKey: ['baselines'] });
    },
    [state, i18n, queryClient],
  );

  const setField = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
    immediate = false,
  ) => {
    setState(s => ({ ...s, [key]: value }));
    if (saveRef.current) clearTimeout(saveRef.current);
    const patch = { [key]: value } as Partial<SettingsState>;
    if (immediate) {
      void persist(patch);
    } else {
      saveRef.current = setTimeout(() => {
        void persist(patch);
      }, 800);
    }
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
  const sleepDisplay = `${String(Math.floor(state.sleep_goal_minutes / 60)).padStart(2, '0')}:${String(state.sleep_goal_minutes % 60).padStart(2, '0')}`;
  const currentLangLabel = LANGUAGES.find(l => l.code === state.language)?.label ?? state.language;

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PersonalInfoSection
          state={state}
          dobDisplay={dobDisplay}
          sleepDisplay={sleepDisplay}
          onFieldChange={(key, value) => {
            setField(key, value);
          }}
          onFieldChangeImmediate={(key, value) => {
            setField(key, value, true);
          }}
          onShowCalendar={() => {
            setShowCalendar(true);
          }}
          onShowTimePicker={() => {
            setShowTimePicker(true);
          }}
        />

        <BaselinesSection baselines={baselines} />

        <PreferencesSection
          currentLangLabel={currentLangLabel}
          onShowLangPicker={() => {
            setShowLangPicker(true);
          }}
        />

        <ActivityDetectionSection
          selected={state.sensitivity}
          onSelect={(key: SensitivityPreset) => {
            setField('sensitivity', key, true);
          }}
        />

        <View style={{ height: theme.spacing.xxl }} />
      </ScreenLayout>

      {/* Calendar modal for DOB */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCalendar(false);
        }}
      >
        <TouchableOpacity
          style={styles.calOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCalendar(false);
          }}
        >
          <View>
            <Calendar
              current={state.dob || undefined}
              maxDate={new Date().toISOString().slice(0, 10)}
              onDayPress={(day: { dateString: string }) => {
                setField('dob', day.dateString, true);
                setShowCalendar(false);
              }}
              markedDates={
                state.dob
                  ? { [state.dob]: { selected: true, selectedColor: theme.colors.primary } }
                  : {}
              }
              theme={{
                backgroundColor: theme.colors.background,
                calendarBackground: theme.colors.background,
                textSectionTitleColor: theme.colors.text.muted,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.text.primary,
                todayTextColor: theme.colors.sleep,
                dayTextColor: theme.colors.text.primary,
                textDisabledColor: theme.colors.text.muted,
                arrowColor: theme.colors.text.primary,
                monthTextColor: theme.colors.text.primary,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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

      <LanguageSheet
        visible={showLangPicker}
        currentCode={state.language}
        onSelect={code => {
          setField('language', code, true);
          setShowLangPicker(false);
        }}
        onClose={() => {
          setShowLangPicker(false);
        }}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xs,
  },
  calOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
