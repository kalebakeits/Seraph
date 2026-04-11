import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { Section } from '../../../components/common/Section';
import { theme } from '../../../theme';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { useSleepDurationTrend } from './useSleepDurationTrend';
import { SleepDurationBars } from './SleepDurationBars';
import { SleepConsistencyCard } from '../../sleep/consistency/SleepConsistencyCard';
import { SleepTimingChart } from '../../sleep/consistency/SleepTimingChart';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { useStrainSleepTrend } from '../shared/useStrainSleepTrend';
import { trendSharedStyles as s } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { formatDuration } from '../../../utils/dateUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendSleep'>;

const COLOR = theme.colors.sleep;

export const SleepTrendScreen: React.FC<Props> = ({ route }) => {
  const { anchorDate } = route.params ?? {};
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useSleepDurationTrend(range, anchorDate);
  const { data: dualData } = useStrainSleepTrend(anchorDate);

  const points = data?.points ?? [];
  const summary = data?.summary ?? null;

  return (
    <View style={[s.container, { paddingTop: insets.top + 48 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TrendRangeControl
          range={range}
          color={COLOR}
          anchorDate={anchorDate}
          onRangeChange={setRange}
        />
        <HelperText translationKey="trends.helper_sleep" />
        <View style={sectionStyles.container}>
          {summary && (
            <TrendSummaryRow
              summary={summary}
              color={COLOR}
              unit=""
              fmt={v => formatDuration(Math.round(v) * 60_000)}
            />
          )}
          {isLoading ? (
            <View style={s.loading}>
              <ActivityIndicator color={COLOR} />
            </View>
          ) : (
            <TrendChart
              points={points}
              color={COLOR}
              unit=""
              range={range}
              format={v => formatDuration(Math.round(v) * 60_000)}
              summary={summary}
              weekChart={<SleepDurationBars anchorDate={anchorDate} />}
            />
          )}
        </View>
        {dualData && (
          <Section title={t('sleep.strainVsSleep')} subtitle={t('sleep.strainVsSleepDesc')}>
            <SkiaDualAxisChart
              a={{
                values: dualData.left.map(p => p.value),
                color: theme.colors.strain,
                name: t('home.strain'),
                formatValue: v => String(Math.round(v * 10) / 10),
              }}
              b={{
                values: dualData.right.map(p => p.value),
                color: theme.colors.sleep,
                name: t('home.sleep'),
                formatValue: v => formatDuration(Math.round(v) * 60_000),
              }}
              xLabels={dualData.left.map(p => p.label)}
            />
          </Section>
        )}
        <Section title={t('sleep.consistency')}>
          <SleepConsistencyCard anchorDate={anchorDate} />
          <SleepTimingChart anchorDate={anchorDate} />
        </Section>
      </ScrollView>
    </View>
  );
};
