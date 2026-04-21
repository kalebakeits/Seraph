import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Section } from '../../../components/common/Section';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { SkiaLineChart } from '../../../components/common/SkiaLineChart';
import { HelperText } from '../../../components/common/HelperText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { fmtInteger } from '../shared/trendFormatUtils';
import { useTrendData } from '../useTrendData';
import { useStrainRhrTrend } from '../shared/useStrainRhrTrend';
import { useSleepHrTrend } from '../sleep/useSleepHrTrend';
import type { TrendContentProps } from '../TrendTypes';

export const RhrContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const { t } = useTranslation();
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useTrendData('rhr', range, anchorDate);
  const { data: rhrDual } = useStrainRhrTrend(anchorDate);
  const { data: sleepHr } = useSleepHrTrend(anchorDate);
  const points = data?.points ?? [];
  const summary = data?.summary ?? null;
  return (
    <>
      <TrendRangeControl
        range={range}
        color={theme.colors.sleep}
        tint={theme.colors.iconTint.sleep}
        anchorDate={anchorDate}
        onRangeChange={onRangeChange}
      />
      <HelperText translationKey="trends.helper_rhr" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow
            summary={summary}
            color={theme.colors.sleep}
            unit=" bpm"
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
            unit=" bpm"
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
    </>
  );
};
