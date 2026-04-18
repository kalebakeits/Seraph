import React, { useState, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { Section } from '../../../components/common/Section';
import { useTheme } from '../../../theme';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { useTrendData } from '../useTrendData';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { SkiaLineChart } from '../../../components/common/SkiaLineChart';
import { useStrainRhrTrend } from '../shared/useStrainRhrTrend';
import { useSleepHrTrend } from '../sleep/useSleepHrTrend';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { fmtInteger } from '../shared/trendFormatUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendHr'>;

const UNIT = ' bpm';

export const HeartRateTrendScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const s = buildTrendSharedStyles(theme);
  const { anchorDate } = route.params ?? {};
  const { t } = useTranslation();
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useTrendData('rhr', range, anchorDate);
  const { data: rhrDual } = useStrainRhrTrend(anchorDate);
  const { data: sleepHr } = useSleepHrTrend(anchorDate);

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
        <HelperText translationKey="trends.helper_rhr" />
        <View style={sectionStyles.container}>
          {summary && (
            <TrendSummaryRow
              summary={summary}
              color={theme.colors.sleep}
              unit={UNIT}
              fmt={fmtInteger}
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
              unit={UNIT}
              range={range}
              format={fmtInteger}
              summary={summary}
            />
          )}
        </View>
        {rhrDual && (
          <Section title={t('trends.strainVsRhr')} subtitle={t('trends.strainVsRhrDesc')}>
            <SkiaDualAxisChart
              a={{
                values: rhrDual.left.map(p => p.value),
                color: theme.colors.strain,
                name: t('home.strain'),
                formatValue: v => String(Math.round(v * 10) / 10),
              }}
              b={{
                values: rhrDual.right.map(p => p.value),
                color: theme.colors.sleep,
                name: t('trends.rhr'),
                formatValue: v => `${fmtInteger(v)} bpm`,
              }}
              xLabels={rhrDual.left.map(p => p.label)}
            />
          </Section>
        )}
        {sleepHr && sleepHr.some(p => p.value !== null) && (
          <Section title={t('trends.sleepHr')}>
            <SkiaLineChart
              data={sleepHr
                .filter((p): p is typeof p & { value: number } => p.value !== null)
                .map(p => ({ value: p.value, label: p.label }))}
              color={theme.colors.sleep}
              yLabelSuffix=" bpm"
              formatYLabel={v => fmtInteger(v)}
              areaChart
            />
          </Section>
        )}
      </ScrollView>
    </View>
  );
};
