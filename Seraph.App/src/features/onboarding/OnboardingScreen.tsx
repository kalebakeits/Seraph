import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { ViewToken } from 'react-native';
import {
  View,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { GradientBackground } from '../../components/common/GradientBackground';
import { useTheme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle';
import { WelcomePage } from './WelcomePage';
import { ThemePickerPage } from './ThemePickerPage';
import { ProfilePage } from './ProfilePage';
import { SensitivityPage } from './SensitivityPage';
import { DonePage } from './DonePage';
import { StoragePage } from './StoragePage';
import { ConnectPage } from './ConnectPage';
import { buildStyles } from './OnboardingStyles';
import { reportError } from '../../utils/reportError';
import type { PageKey, SensitivityPreset, ProfileDraft } from './OnboardingTypes';
import { SENSITIVITY_PRESETS } from '../profile/ProfileSettingsTypes';
import type { GranularitySeconds } from '../profile/utils/storageUtils';

interface Props {
  onComplete: () => void;
}

const PAGES: PageKey[] = [
  'welcome',
  'theme',
  'profile',
  'sensitivity',
  'storage',
  'connect',
  'done',
];

const CONNECT_INDEX = PAGES.indexOf('connect');
const DONE_INDEX = PAGES.indexOf('done');

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);
  // Max page reached — never decrements on back. Persisted to DB.
  const [maxIndex, setMaxIndex] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>({
    name: '',
    dob: '',
    sex: '',
    height_cm: '',
    weight_kg: '',
    sleep_goal_minutes: 480,
    fthr: '',
  });
  const [sensitivity, setSensitivity] = useState<SensitivityPreset>('moderate');
  const [granularity, setGranularity] = useState<GranularitySeconds>(1);

  // Restore max progress — start directly on saved page, no animation
  useEffect(() => {
    void appParametersRepository.get('onboarding_page').then(saved => {
      if (saved) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx > 0 && idx < PAGES.length) {
          setMaxIndex(idx);
          setResumeIndex(idx);
          setCurrentIndex(idx);
        }
      }
    });
  }, []);

  const advanceTo = useCallback(
    (index: number) => {
      listRef.current?.scrollToIndex({ index, animated: true });
      if (index > maxIndex) {
        setMaxIndex(index);
        void appParametersRepository.set('onboarding_page', index);
      }
    },
    [maxIndex],
  );

  const handleNext = async () => {
    if (currentIndex === DONE_INDEX) {
      await saveAndComplete();
    } else {
      advanceTo(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      listRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const handleConnected = useCallback(() => {
    advanceTo(DONE_INDEX);
  }, [advanceTo]);

  const saveAndComplete = async () => {
    try {
      const preset = SENSITIVITY_PRESETS.find(p => p.key === sensitivity) ?? SENSITIVITY_PRESETS[2];

      let age: number | null = null;
      if (draft.dob) {
        const dob = new Date(draft.dob + 'T12:00:00Z');
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      }

      type Param = Parameters<typeof appParametersRepository.set>[0];
      const entries: [Param, string][] = [
        ['profile_name', draft.name],
        ['profile_dob', draft.dob],
        ['profile_sex', draft.sex],
        ['profile_height_cm', draft.height_cm],
        ['profile_weight_kg', draft.weight_kg],
        ['profile_sleep_goal_minutes', String(draft.sleep_goal_minutes)],
        ['profile_threshold_hr', draft.fthr],
        ['activity_min_trimp', String(preset.minTrimp)],
        ['activity_min_ms', String(preset.minMs)],
        ['r24_granularity_seconds', String(granularity)],
      ];

      if (age !== null) entries.push(['profile_age', String(age)]);

      await Promise.all([
        ...entries.filter(([, v]) => v !== '').map(([k, v]) => appParametersRepository.set(k, v)),
        appParametersRepository.set('onboarding_complete', '1'),
        // Clear the resume crumb so a completed onboarding never restores mid-flow.
        appParametersRepository.delete('onboarding_page'),
      ]);
    } catch (e) {
      reportError(e, 'onboarding', 'saveAndComplete');
      // Never lock the user out of the app. Best-effort mark complete so they
      // don't loop back here, then continue into the main UI regardless.
      try {
        await Promise.all([
          appParametersRepository.set('onboarding_complete', '1'),
          appParametersRepository.delete('onboarding_page'),
        ]);
      } catch (markError) {
        reportError(markError, 'onboarding', 'markComplete');
      }
    } finally {
      onComplete();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setCurrentIndex(viewableItems[0].index);
  }).current;

  const isConnect = currentIndex === CONNECT_INDEX;
  const isDone = currentIndex === DONE_INDEX;

  const renderPage = ({ item }: { item: PageKey }) => {
    switch (item) {
      case 'welcome':
        return <WelcomePage width={width} />;
      case 'theme':
        return <ThemePickerPage width={width} />;
      case 'profile':
        return <ProfilePage width={width} draft={draft} setDraft={setDraft} />;
      case 'sensitivity':
        return (
          <SensitivityPage
            width={width}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
          />
        );
      case 'storage':
        return (
          <StoragePage width={width} granularity={granularity} setGranularity={setGranularity} />
        );
      case 'connect':
        return <ConnectPage width={width} onConnected={handleConnected} />;
      case 'done':
        return <DonePage width={width} />;
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.dotsRow}>
            {PAGES.map((page, i) => (
              <View key={page} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>

          <FlatList
            ref={listRef}
            data={PAGES}
            renderItem={renderPage}
            keyExtractor={item => item}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            initialScrollIndex={resumeIndex ?? 0}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            style={{ flex: 1 }}
          />

          <View style={styles.navRow}>
            {currentIndex > 0 ? (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={theme.colors.text.secondary} />
                <SafeText style={styles.backText}>{t('onboarding.back')}</SafeText>
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}

            {isConnect ? (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => {
                  advanceTo(DONE_INDEX);
                }}
                activeOpacity={0.7}
              >
                <SafeText style={styles.skipText}>{t('onboarding.skip')}</SafeText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, isDone && { backgroundColor: theme.colors.recovery }]}
                onPress={() => {
                  void handleNext();
                }}
                activeOpacity={0.8}
              >
                <SafeText style={styles.nextText}>
                  {isDone ? t('onboarding.getStarted') : t('onboarding.next')}
                </SafeText>
                {!isDone && (
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.icon.onLight} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};
