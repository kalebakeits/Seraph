import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Section } from '../../../components/common/Section';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { HelperText } from '../../../components/common/HelperText';
import { SleepDurationBars } from '../sleep/SleepDurationBars';
import { SleepConsistencyCard } from '../../sleep/consistency/SleepConsistencyCard';
import { SleepTimingChart } from '../../sleep/consistency/SleepTimingChart';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { formatDuration } from '../../../utils/dateUtils';
import { useSleepDurationTrend } from '../sleep/useSleepDurationTrend';
import { useStrainSleepTrend } from '../shared/useStrainSleepTrend';
import type { TrendContentProps } from '../TrendTypes';

export const SleepContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const { t } = useTranslation();
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useSleepDurationTrend(range, anchorDate);
  const { data: dualData } = useStrainSleepTrend(anchorDate);
  const points = data?.points ?? [];
  const summary = data?.summary ?? null;
  const fmt = (v: number) => formatDuration(Math.round(v) * 60_000);
  return (
    <>
      <TrendRangeControl
        range={range}
        color={theme.colors.sleep}
        tint={theme.colors.iconTint.sleep}
        anchorDate={anchorDate}
        onRangeChange={onRangeChange}
      />
      <HelperText translationKey="trends.helper_sleep" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow summary={summary} color={theme.colors.sleep} unit="" fmt={fmt} />
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
            format={fmt}
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
    </>
  );
};
