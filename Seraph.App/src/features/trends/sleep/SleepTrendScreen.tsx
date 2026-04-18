import React, { useState, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { Section } from '../../../components/common/Section';
import { useTheme } from '../../../theme';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { useSleepDurationTrend } from './useSleepDurationTrend';
import { SleepDurationBars } from './SleepDurationBars';
import { SleepConsistencyCard } from '../../sleep/consistency/SleepConsistencyCard';
import { SleepTimingChart } from '../../sleep/consistency/SleepTimingChart';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { useStrainSleepTrend } from '../shared/useStrainSleepTrend';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { formatDuration } from '../../../utils/dateUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendSleep'>;

export const SleepTrendScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const s = buildTrendSharedStyles(theme);
  const { anchorDate } = route.params ?? {};
  const { t } = useTranslation();
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useSleepDurationTrend(range, anchorDate);
  const { data: dualData } = useStrainSleepTrend(anchorDate);

  const points = data?.points ?? [];
  const summary = data?.summary ?? null;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TrendRangeControl
          range={range}
          color={theme.colors.sleep}
          tint={theme.colors.iconTint.sleep}
          anchorDate={anchorDate}
          onRangeChange={setRange}
        />
        <HelperText translationKey="trends.helper_sleep" />
        <View style={sectionStyles.container}>
          {summary && (
            <TrendSummaryRow
              summary={summary}
              color={theme.colors.sleep}
              unit=""
              fmt={v => formatDuration(Math.round(v) * 60_000)}
            />
          )}
          {isLoading ? (
            <View style={s.loading}>
              <ActivityIndicator color={theme.colors.sleep} />
            </View>
          ) : (
            <TrendChart
              points={points}
              color={theme.colors.sleep}
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
