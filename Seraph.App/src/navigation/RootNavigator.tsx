import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GradientBackground } from '../components/common/GradientBackground';
import { NativeModules } from 'react-native';
import { FloatingTabBar } from './FloatingTabBar';
import { HomeStackNavigator } from './HomeStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { useDeviceInit } from '../hooks/useDeviceInit';
import { InsightsScreen } from '../features/coach/InsightsScreen';
import { navigationRef } from './navigationRef';
import { seraphEmitter } from '../services/ble/nativeModule';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

const linking = {
  prefixes: ['seraph://'],
  config: {
    screens: {
      Home: {
        initialRouteName: 'HomeMain',
        screens: {
          WorkoutDetail: {
            path: 'workout/:activityId',
            parse: { activityId: Number },
          },
          SleepSessionDetail: {
            path: 'sleep/:sleepId',
            parse: { sleepId: Number },
          },
        },
      },
    },
  },
  async getInitialURL() {
    try {
      const module = NativeModules.SeraphModule as
        | { getInitialDeepLink?: () => Promise<string | null> }
        | undefined;
      const url: string | null = (await module?.getInitialDeepLink?.()) ?? null;
      return url;
    } catch {
      return null;
    }
  },
  subscribe(listener: (url: string) => void) {
    const sub = seraphEmitter.addListener('onDeepLink', (event: { url: string }) => {
      listener(event.url);
    });
    return () => {
      sub.remove();
    };
  },
};

export const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  useDeviceInit();

  return (
    <GradientBackground>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */}
      <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking as any}>
        <Tab.Navigator
          tabBar={props => <FloatingTabBar {...props} />}
          screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
        >
          <Tab.Screen
            name="Home"
            component={HomeStackNavigator}
            options={{
              tabBarLabel: t('nav.home'),
            }}
          />
          <Tab.Screen
            name="Insights"
            component={InsightsScreen}
            options={{
              tabBarLabel: t('nav.insights'),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStackNavigator}
            options={{
              tabBarLabel: t('nav.settings'),
              headerShown: false,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GradientBackground>
  );
};
