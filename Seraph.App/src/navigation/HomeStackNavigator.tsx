import React from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/HomeScreen';
import { Sleep } from '../features/sleep/Sleep';
import { Recovery } from '../features/recovery/Recovery';
import { Strain } from '../features/strain/Strain';
import { DeviceManagementScreen } from '../features/device-management/DeviceManagementScreen';
import { WakeUpScreen } from '../features/wake-up-time/WakeUpScreen';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { ProfileSettingsScreen } from '../features/profile/ProfileSettingsScreen';
import { DataStorageScreen } from '../features/profile/DataStorageScreen';
import { AboutScreen } from '../features/profile/AboutScreen';
import { DebugMenuScreen } from '../features/device-management/device-details/DebugMenuScreen';
import { StepsTrendScreen } from '../features/trends/steps/StepsTrendScreen';
import { ActiveTimeTrendScreen } from '../features/trends/active-time/ActiveTimeTrendScreen';
import { HrvTrendScreen } from '../features/trends/hrv/HrvTrendScreen';
import { HeartRateTrendScreen } from '../features/trends/rhr/HeartRateTrendScreen';
import { SkinTempTrendScreen } from '../features/trends/skin-temp/SkinTempTrendScreen';
import { DailyStressTrendScreen } from '../features/trends/daily-stress/DailyStressTrendScreen';
import { SleepTrendScreen } from '../features/trends/sleep/SleepTrendScreen';
import { RecoveryTrendScreen } from '../features/trends/recovery/RecoveryTrendScreen';
import { StrainTrendScreen } from '../features/trends/strain/StrainTrendScreen';
import { WorkoutDetailScreen } from '../features/workout/WorkoutDetailScreen';
import { SleepSessionScreen } from '../features/sleep/session/SleepSessionScreen';
import { SleepAwakeTrendScreen } from '../features/trends/sleep/SleepAwakeTrendScreen';
import { RecordWorkoutScreen } from '../features/record-workout/RecordWorkoutScreen';
import { NotificationCenterScreen } from '../features/notifications/NotificationCenterScreen';

export interface HomeStackParamList {
  [key: string]: object | undefined;
  HomeMain: undefined;
  Sleep: { selectedDate?: string } | undefined;
  Recovery: { selectedDate?: string } | undefined;
  Strain: { selectedDate?: string } | undefined;
  DeviceManagement: undefined;
  WakeUp: undefined;
  Profile: undefined;
  ProfileSettings: undefined;
  DataStorage: undefined;
  About: undefined;
  DebugMenu: undefined;
  TrendSteps: { anchorDate?: string } | undefined;
  TrendActiveTime: { anchorDate?: string } | undefined;
  TrendHrv: { anchorDate?: string } | undefined;
  TrendHr: { anchorDate?: string } | undefined;
  TrendSkinTemp: { anchorDate?: string } | undefined;
  TrendDailyStress: { anchorDate?: string } | undefined;
  TrendSleep: { anchorDate?: string } | undefined;
  TrendRecovery: { anchorDate?: string } | undefined;
  TrendStrain: { anchorDate?: string } | undefined;
  TrendSleepAwake: { anchorDate?: string } | undefined;
  WorkoutDetail: { activityId: number; selectedDate?: string };
  SleepSessionDetail: { sleepId: number; selectedDate?: string };
  RecordWorkout: undefined;
  NotificationCenter: undefined;
}

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: 'transparent' },
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerTintColor: '#ffffff',
        headerTitle: '',
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Sleep"
        component={Sleep}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.sleep'),
        }}
      />
      <Stack.Screen
        name="Recovery"
        component={Recovery}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.recovery'),
        }}
      />
      <Stack.Screen
        name="Strain"
        component={Strain}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.strain'),
        }}
      />
      <Stack.Screen
        name="DeviceManagement"
        component={DeviceManagementScreen}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.deviceManagement'),
        }}
      />
      <Stack.Screen
        name="WakeUp"
        component={WakeUpScreen}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.wakeUpTime'),
        }}
      />
      <Stack.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.settings'),
        }}
      />
      <Stack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{ headerTitle: t('settings.profileAndPreferences') }}
      />
      <Stack.Screen
        name="DataStorage"
        component={DataStorageScreen}
        options={{ headerTitle: t('settings.dataAndStorage') }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerTitle: t('settings.about') }}
      />
      <Stack.Screen name="DebugMenu" component={DebugMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="TrendSteps"
        component={StepsTrendScreen}
        options={{ headerTitle: t('nav.trendSteps'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendActiveTime"
        component={ActiveTimeTrendScreen}
        options={{ headerTitle: t('nav.trendActiveTime'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendHrv"
        component={HrvTrendScreen}
        options={{ headerTitle: t('nav.trendHrv'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendHr"
        component={HeartRateTrendScreen}
        options={{ headerTitle: t('nav.trendHr'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendSkinTemp"
        component={SkinTempTrendScreen}
        options={{ headerTitle: t('nav.trendSkinTemp'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendDailyStress"
        component={DailyStressTrendScreen}
        options={{ headerTitle: t('nav.trendDailyStress'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendSleep"
        component={SleepTrendScreen}
        options={{ headerTitle: t('nav.trendSleep'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendRecovery"
        component={RecoveryTrendScreen}
        options={{ headerTitle: t('nav.trendRecovery'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="TrendStrain"
        component={StrainTrendScreen}
        options={{ headerTitle: t('nav.trendStrain'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{
          headerTitle: t('nav.workout'),
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="SleepSessionDetail"
        component={SleepSessionScreen}
        options={{
          headerTitle: t('nav.sleepSession'),
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="TrendSleepAwake"
        component={SleepAwakeTrendScreen}
        options={{ headerTitle: t('nav.trendSleepAwake'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="RecordWorkout"
        component={RecordWorkoutScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          presentation: 'modal',
          headerTitle: t('nav.notificationCenter'),
        }}
      />
    </Stack.Navigator>
  );
};
