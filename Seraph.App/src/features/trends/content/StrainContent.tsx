import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Section } from '../../../components/common/Section';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { HelperText } from '../../../components/common/HelperText';
import { StrainBars } from '../../strain/components/StrainBars';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { fmtDecimal1, fmtInteger } from '../shared/trendFormatUtils';
import { formatDuration } from '../../../utils/dateUtils';
import { useTrendData } from '../useTrendData';
import { useStrainRecoveryTrend } from '../shared/useStrainRecoveryTrend';
import { useStrainRhrTrend } from '../shared/useStrainRhrTrend';
import { useStrainSleepTrend } from '../shared/useStrainSleepTrend';
import type { TrendContentProps } from '../TrendTypes';

export const StrainContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const { t } = useTranslation();
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useTrendData('strain', range, anchorDate);
  const { data: recoveryDual } = useStrainRecoveryTrend(anchorDate);
  const { data: sleepDual } = useStrainSleepTrend(anchorDate);
  const { data: rhrDual } = useStrainRhrTrend(anchorDate);
  const points = data?.points ?? [];
  const summary = data?.summary ?? null;
  return (
    <>
      <TrendRangeControl
        range={range}
        color={theme.colors.strain}
        tint={theme.colors.iconTint.strain}
        anchorDate={anchorDate}
        onRangeChange={onRangeChange}
      />
      <HelperText translationKey="trends.helper_strain" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow
            summary={summary}
            color={theme.colors.strain}
            unit=""
            fmt={fmtDecimal1}
          />
        )}
        {isLoading ? (
          <View style={s.loading}>
            <ActivityIndicator color={theme.colors.strain} />
          </View>
        ) : (
          <TrendChart
            points={points}
            color={theme.colors.strain}
            unit=""
            range={range}
            format={fmtDecimal1}
            summary={summary}
            weekChart={<StrainBars anchorDate={anchorDate} />}
          />
        )}
      </View>
      {recoveryDual && (
        <Section
          title={t('recovery.strainVsRecovery')}
          subtitle={t('recovery.strainVsRecoveryDesc')}
        >
          <SkiaDualAxisChart
            a={{
              values: recoveryDual.left.map(p => p.value),
              color: theme.colors.strain,
              name: t('home.strain'),
              formatValue: v => String(Math.round(v * 10) / 10),
            }}
            b={{
              values: recoveryDual.right.map(p => p.value),
              color: theme.colors.recovery,
              name: t('home.recovery'),
              formatValue: v => `${String(Math.round(v))}%`,
            }}
            xLabels={recoveryDual.left.map(p => p.label)}
          />
        </Section>
      )}
      {sleepDual && (
        <Section title={t('sleep.strainVsSleep')} subtitle={t('sleep.strainVsSleepDesc')}>
          <SkiaDualAxisChart
            a={{
              values: sleepDual.left.map(p => p.value),
              color: theme.colors.strain,
              name: t('home.strain'),
              formatValue: v => String(Math.round(v * 10) / 10),
            }}
            b={{
              values: sleepDual.right.map(p => p.value),
              color: theme.colors.sleep,
              name: t('home.sleep'),
              formatValue: v => formatDuration(Math.round(v) * 60_000),
            }}
            xLabels={sleepDual.left.map(p => p.label)}
          />
        </Section>
      )}
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
    </>
  );
};
