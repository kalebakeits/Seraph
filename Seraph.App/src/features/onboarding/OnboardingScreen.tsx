import React, { useRef, useState } from 'react';
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
import { theme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle';
import { WelcomePage } from './WelcomePage';
import { RingsPage } from './RingsPage';
import { OverviewTourPage } from './OverviewTourPage';
import { ProfilePage } from './ProfilePage';
import { SensitivityPage } from './SensitivityPage';
import { DonePage } from './DonePage';
import { StoragePage } from './StoragePage';
import { ConnectPage } from './ConnectPage';
import { styles } from './OnboardingStyles';
import {
  SENSITIVITY_PRESETS,
  type PageKey,
  type SensitivityPreset,
  type ProfileDraft,
} from './OnboardingTypes';
import type { GranularitySeconds } from '../profile/utils/storageUtils';

interface Props {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const PAGES: PageKey[] = [
    'welcome',
    'rings',
    'tour',
    'profile',
    'sensitivity',
    'storage',
    'connect',
    'done',
  ];
  const isLast = currentIndex === PAGES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await saveAndComplete();
    } else {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      listRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const saveAndComplete = async () => {
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
      ['onboarding_complete', '1'],
    ];

    if (age !== null) entries.push(['profile_age', String(age)]);

    await Promise.all(
      entries.filter(([, v]) => v !== '').map(([k, v]) => appParametersRepository.set(k, v)),
    );
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index !== null) setCurrentIndex(viewableItems[0].index);
  }).current;

  const renderPage = ({ item }: { item: PageKey }) => {
    switch (item) {
      case 'welcome':
        return <WelcomePage width={width} />;
      case 'rings':
        return <RingsPage width={width} />;
      case 'tour':
        return <OverviewTourPage width={width} />;
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
        return <ConnectPage width={width} />;
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

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                void handleNext();
              }}
              activeOpacity={0.8}
            >
              <SafeText style={styles.nextText}>
                {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
              </SafeText>
              {!isLast && <Ionicons name="chevron-forward" size={18} color="#000" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};
