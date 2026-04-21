import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { useTheme, type Theme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle';
import type { AppParameter } from '../../services/database/drizzle/repositories/appParametersRepository';
import { PreferencesSection } from './sections/PreferencesSection';
import { ActivityDetectionSection } from './sections/ActivityDetectionSection';
import { LanguageSheet } from './sections/LanguageSheet';
import { NotificationsSection } from './sections/NotificationsSection';
import type { NotificationPreferences } from './sections/NotificationsSection';
import type { SettingsState, SensitivityPreset } from './ProfileSettingsTypes';
import { SENSITIVITY_PRESETS, LANGUAGES, trimpToPreset } from './ProfileSettingsTypes';

export const PreferencesScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

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

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    globalEnabled: true,
    deviceLowBattery: true,
    deviceAlarmNotSet: true,
    activitySleep: true,
    activityWorkout: true,
  });

  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    void (async () => {
      const keys: AppParameter[] = [
        'activity_min_trimp',
        'notif_global_enabled',
        'notif_device_low_battery',
        'notif_device_alarm_not_set',
        'notif_activity_sleep',
        'notif_activity_workout',
      ];
      const values = await Promise.all(keys.map(k => appParametersRepository.get(k)));
      const [
        minTrimp,
        globalEnabled,
        deviceLowBattery,
        deviceAlarmNotSet,
        activitySleep,
        activityWorkout,
      ] = values;

      setState(s => ({
        ...s,
        sensitivity: trimpToPreset(minTrimp ? parseFloat(minTrimp) : null),
      }));

      setNotificationPrefs({
        globalEnabled: globalEnabled !== '0',
        deviceLowBattery: deviceLowBattery !== '0',
        deviceAlarmNotSet: deviceAlarmNotSet !== '0',
        activitySleep: activitySleep !== '0',
        activityWorkout: activityWorkout !== '0',
      });
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
    async (patch: Partial<SettingsState>) => {
      const merged = { ...state, ...patch };
      const preset =
        SENSITIVITY_PRESETS.find(p => p.key === merged.sensitivity) ?? SENSITIVITY_PRESETS[2];

      const entries: [AppParameter, string][] = [
        ['activity_min_trimp', String(preset.minTrimp)],
        ['activity_min_ms', String(preset.minMs)],
      ];

      await Promise.all(
        entries.filter(([, v]) => v !== '').map(([k, v]) => appParametersRepository.set(k, v)),
      );

      if (patch.language && patch.language !== i18n.language.slice(0, 2)) {
        await i18n.changeLanguage(patch.language);
        await appParametersRepository.set('language', patch.language);
      }

      void queryClient.invalidateQueries({ queryKey: ['baselines'] });
    },
    [state, i18n, queryClient],
  );

  const persistNotifications = useCallback(async (prefs: NotificationPreferences) => {
    const entries: [AppParameter, string][] = [
      ['notif_global_enabled', prefs.globalEnabled ? '1' : '0'],
      ['notif_device_low_battery', prefs.deviceLowBattery ? '1' : '0'],
      ['notif_device_alarm_not_set', prefs.deviceAlarmNotSet ? '1' : '0'],
      ['notif_activity_sleep', prefs.activitySleep ? '1' : '0'],
      ['notif_activity_workout', prefs.activityWorkout ? '1' : '0'],
    ];

    await Promise.all(entries.map(([k, v]) => appParametersRepository.set(k, v)));
  }, []);

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

  const handleNotificationChange = (prefs: NotificationPreferences) => {
    setNotificationPrefs(prefs);
    void persistNotifications(prefs);
  };

  const currentLangLabel = LANGUAGES.find(l => l.code === state.language)?.label ?? state.language;

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content}>
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

        <NotificationsSection preferences={notificationPrefs} onChange={handleNotificationChange} />

        <View style={{ height: theme.spacing.xxl }} />
      </ScreenLayout>

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

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xs,
    },
  });
}
