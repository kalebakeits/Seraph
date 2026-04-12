import i18n from './src/i18n';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAutoConnect } from './src/hooks/useAutoConnect';
import { initDb, appParametersRepository } from './src/services/database/drizzle';
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

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
      <InAppBanner />
    </>
  );
}

type AppState = 'onboarding' | 'ready';

export default Sentry.wrap(function App() {
  const [appState, setAppState] = useState<AppState | null>(null);

  useEffect(() => {
    initDb()
      .then(async () => {
        const savedLang = await appParametersRepository.get('language');
        if (!savedLang) {
          await appParametersRepository.set('language', i18n.language.slice(0, 2));
        }
        const onboarded = await appParametersRepository.get('onboarding_complete');
        setAppState(onboarded === '1' ? 'ready' : 'onboarding');
      })
      .catch(() => {
        setAppState('onboarding');
      })
      .finally(() => {
        SplashScreen.setOptions({ fade: true, duration: 500 });
        void SplashScreen.hideAsync();
      });
  }, []);

  if (appState === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {appState === 'onboarding' ? (
            <OnboardingScreen
              onComplete={() => {
                void initDb().finally(() => setAppState('ready'));
              }}
            />
          ) : (
            <AppContent />
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
