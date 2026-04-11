import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { SafeText } from '../../components/common/SafeText';
import { LastNightCard } from './last-night/LastNightCard';
import { SleepSessionStatsCard } from './session/SleepSessionStatsCard';
import { SleepConsistencyCard } from './consistency/SleepConsistencyCard';
import { SleepTimingChart } from './consistency/SleepTimingChart';
import { theme } from '../../theme';
import { todayISO, formatDateHeader } from '../../utils/dateUtils';
import type {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { Section } from '../../components/common/Section';
import { HelperText } from '../../components/common/HelperText';
import { useSleepSessions } from './hooks/useSleepSessions';
import { useRecentSleep } from './last-night/useRecentSleep';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<HomeStackParamList, 'Sleep'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

export const Sleep: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const selectedDate = route.params?.selectedDate;
  const date = selectedDate ?? todayISO();

  const { data: allSleep = [] } = useSleepSessions(date);
  const { data: recentSleep } = useRecentSleep(date);

  const primary =
    allSleep.length > 0
      ? allSleep.reduce((best, s) => (s.duration_minutes > best.duration_minutes ? s : best))
      : null;
  const naps = allSleep.filter(s => s.id !== primary?.id);

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SafeText style={styles.dateHeader}>{formatDateHeader(date)}</SafeText>
        <HelperText translationKey="sleep.pageHelper" />

        <Section title={t('sleep.lastNight')}>
          <HelperText translationKey="sleep.lastNightHelper" />
          <LastNightCard
            selectedDate={date}
            onPress={
              recentSleep
                ? () => {
                    navigation.navigate('SleepSessionDetail', {
                      sleepId: recentSleep.id,
                      selectedDate: date,
                    });
                  }
                : undefined
            }
          />
        </Section>

        {naps.length > 0 && (
          <Section title={t('sleep.naps')}>
            {naps.map(nap => (
              <SleepSessionStatsCard
                key={nap.id}
                session={nap}
                onPress={() => {
                  navigation.navigate('SleepSessionDetail', {
                    sleepId: nap.id,
                    selectedDate: date,
                  });
                }}
              />
            ))}
          </Section>
        )}

        <Section
          title={t('sleep.trends')}
          onTitlePress={() => {
            navigation.navigate('TrendSleep', { anchorDate: selectedDate });
          }}
        >
          <HelperText translationKey="sleep.trendsHelper" />
          <SleepConsistencyCard anchorDate={selectedDate} />
          <SleepTimingChart anchorDate={selectedDate} />
        </Section>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  dateHeader: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    paddingHorizontal: 2,
    marginBottom: theme.spacing.xs,
  },
});
