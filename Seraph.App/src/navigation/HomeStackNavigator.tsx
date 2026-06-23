import React from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
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
import { TrendsScreen } from '../features/trends/TrendsScreen';
import type { TrendKey } from '../features/trends/TrendConfig';
import { WorkoutDetailScreen } from '../features/workout/WorkoutDetailScreen';
import { SleepSessionScreen } from '../features/sleep/session/SleepSessionScreen';
import { RecordWorkoutScreen } from '../features/record-workout/RecordWorkoutScreen';
import { NotificationCenterScreen } from '../features/notifications/NotificationCenterScreen';
import { SystemNotificationDetailScreen } from '../features/notifications/SystemNotificationDetailScreen';
import { NapActiveScreen } from '../features/nap/NapActiveScreen';
import { NapSetupScreen } from '../features/nap/NapSetupScreen';
import { ChooseHabitsScreen } from '../features/habits/ChooseHabitsScreen';
import { LogHabitsScreen } from '../features/habits/LogHabitsScreen';

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
  Trends: { initialTrend?: TrendKey; anchorDate?: string } | undefined;
  WorkoutDetail: { activityId: number; selectedDate?: string };
  SleepSessionDetail: { sleepId: number; selectedDate?: string };
  RecordWorkout: undefined;
  NotificationCenter: undefined;
  SystemNotificationDetail: { title: string; body: string; type: string };
  NapActive: undefined;
  NapSetup: undefined;
  ChooseHabits: undefined;
  LogHabits: { selectedDate?: string } | undefined;
}

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface.card },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { color: theme.colors.text.primary, fontWeight: '600' },
        headerTitleAlign: 'center',
        headerBackTitle: '',
        headerShadowVisible: true,
        animation: 'default',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Sleep"
        component={Sleep}
        options={{ presentation: 'modal', headerTitle: t('nav.sleep') }}
      />
      <Stack.Screen
        name="Recovery"
        component={Recovery}
        options={{ presentation: 'modal', headerTitle: t('nav.recovery') }}
      />
      <Stack.Screen
        name="Strain"
        component={Strain}
        options={{ presentation: 'modal', headerTitle: t('nav.strain') }}
      />
      <Stack.Screen
        name="DeviceManagement"
        component={DeviceManagementScreen}
        options={{ presentation: 'modal', headerTitle: t('nav.deviceManagement') }}
      />
      <Stack.Screen
        name="WakeUp"
        component={WakeUpScreen}
        options={{ presentation: 'modal', headerTitle: t('nav.wakeUpTime') }}
      />
      <Stack.Screen
        name="Profile"
        component={SettingsScreen}
        options={{ presentation: 'modal', headerTitle: t('nav.settings') }}
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
        name="Trends"
        component={TrendsScreen}
        options={{ headerShown: false, headerBackTitle: '' }}
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
      <Stack.Screen
        name="SystemNotificationDetail"
        component={SystemNotificationDetailScreen}
        options={{ headerTitle: '', headerBackTitle: '' }}
      />
      <Stack.Screen
        name="NapActive"
        component={NapActiveScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="ChooseHabits"
        component={ChooseHabitsScreen}
        options={{
          headerTitle: t('nav.chooseHabits'),
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="NapSetup"
        component={NapSetupScreen}
        options={{
          headerTitle: t('nap.startNap'),
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="LogHabits"
        component={LogHabitsScreen}
        options={{
          headerTitle: t('habits.logHabits'),
          headerBackTitle: '',
        }}
      />
    </Stack.Navigator>
  );
};
