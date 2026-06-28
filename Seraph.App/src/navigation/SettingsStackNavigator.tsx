import React from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { ProfileScreen } from '../features/settings/ProfileScreen';
import { PreferencesScreen } from '../features/settings/PreferencesScreen';
import { DataStorageScreen } from '../features/settings/DataStorageScreen';
import { AboutScreen } from '../features/settings/AboutScreen';
import { DebugMenuScreen } from '../features/device-management/device-details/DebugMenuScreen';

export interface SettingsStackParamList {
  [key: string]: object | undefined;
  SettingsMain: undefined;
  Profile: undefined;
  Preferences: undefined;
  DataStorage: undefined;
  About: undefined;
  DebugMenu: undefined;
}

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator: React.FC = () => {
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
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerTitle: t('nav.settings') }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: t('settings.profile') }}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ headerTitle: t('settings.preferencesMenu') }}
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
