import React from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { ProfileSettingsScreen } from '../features/profile/ProfileSettingsScreen';
import { DataStorageScreen } from '../features/profile/DataStorageScreen';
import { AboutScreen } from '../features/profile/AboutScreen';
import { DebugMenuScreen } from '../features/device-management/device-details/DebugMenuScreen';

export interface SettingsStackParamList {
  [key: string]: object | undefined;
  SettingsMain: undefined;
  ProfileSettings: undefined;
  DataStorage: undefined;
  About: undefined;
  DebugMenu: undefined;
}

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator: React.FC = () => {
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
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerTitle: t('nav.settings') }}
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
    </Stack.Navigator>
  );
};
