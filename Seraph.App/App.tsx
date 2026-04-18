import i18n from './src/i18n';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from './src/theme/ThemeContext';
import type { ThemeName } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAutoConnect } from './src/hooks/useAutoConnect';
import { initDb, appParametersRepository } from './src/services/database/drizzle';
import { seedHabitsIfNeeded } from './src/features/habits/utils/seedHabits';
import { useDeviceInit } from './src/hooks/useDeviceInit';
import { useSyncState } from './src/hooks/useSyncState';
import { useNotificationPermission } from './src/hooks/useNotificationPermission';
import { InAppBanner } from './src/components/common/InAppBanner';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://f2eceebb268c9688c379cd9f5698c2c9@o4511143430389760.ingest.de.sentry.io/4511143434780752',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function AppContent() {
  useAutoConnect();
  useDeviceInit();
  useSyncState();
  useNotificationPermission();
  const { themeName } = useTheme();
  const systemScheme = useColorScheme();
  const isLight =
    themeName === 'light' || (themeName === 'system' && systemScheme === 'light');
  const statusBarStyle = isLight ? 'dark' : 'light';

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <RootNavigator />
      <InAppBanner />
    </>
  );
}

type AppState = 'onboarding' | 'ready';

export default Sentry.wrap(function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [initialTheme, setInitialTheme] = useState<ThemeName>('system');

  useEffect(() => {
    const init = async () => {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const validThemes: ThemeName[] = [
        'midnightPurple', 'dark', 'light', 'system',
        'monokai', 'tomorrowNightBlue', 'sierraSunset', 'kimbieDark',
      ];
      if (savedTheme && (validThemes as string[]).includes(savedTheme)) {
        setInitialTheme(savedTheme as ThemeName);
      }
      try {
        await initDb();
        const savedLang = await appParametersRepository.get('language');
        if (!savedLang) {
          await appParametersRepository.set('language', i18n.language.slice(0, 2));
        }
        await seedHabitsIfNeeded();
        const onboarded = await appParametersRepository.get('onboarding_complete');
        setAppState(onboarded === '1' ? 'ready' : 'onboarding');
      } catch {
        setAppState('onboarding');
      } finally {
        SplashScreen.setOptions({ fade: true, duration: 500 });
        void SplashScreen.hideAsync();
      }
    };
    void init();
  }, []);

  if (appState === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialTheme={initialTheme}>
          <QueryClientProvider client={queryClient}>
            {appState === 'onboarding' ? (
              <OnboardingScreen
                onComplete={() => {
                  initDb()
                    .finally(() => {
                      setAppState('ready');
                    })
                    .catch(console.error);
                }}
              />
            ) : (
              <AppContent />
            )}
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
