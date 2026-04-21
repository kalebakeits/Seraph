import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Section } from '../../../components/common/Section';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { HelperText } from '../../../components/common/HelperText';
import { RecoveryBars } from '../../recovery/components/RecoveryBars';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { fmtInteger } from '../shared/trendFormatUtils';
import { useTrendData } from '../useTrendData';
import { useStrainRecoveryTrend } from '../shared/useStrainRecoveryTrend';
import { useRecoveryHistory } from '../../recovery/hooks/useRecoveryHistory';
import type { TrendContentProps } from '../TrendTypes';

export const RecoveryContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const { t } = useTranslation();
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useTrendData('recovery', range, anchorDate);
  const { data: history = [] } = useRecoveryHistory(anchorDate);
  const { data: dualData } = useStrainRecoveryTrend(anchorDate);
  const points = data?.points ?? [];
  const summary = data?.summary ?? null;
  return (
    <>
      <TrendRangeControl
        range={range}
        color={theme.colors.recovery}
        tint={theme.colors.iconTint.recovery}
        anchorDate={anchorDate}
        onRangeChange={onRangeChange}
      />
      <HelperText translationKey="trends.helper_recovery" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow
            summary={summary}
            color={theme.colors.recovery}
            unit="%"
            fmt={fmtInteger}
          />
        )}
        {isLoading ? (
          <View style={s.loading}>
            <ActivityIndicator color={theme.colors.recovery} />
          </View>
        ) : (
          <TrendChart
            points={points}
            color={theme.colors.recovery}
            unit="%"
            range={range}
            format={fmtInteger}
            summary={summary}
            weekChart={<RecoveryBars data={history} />}
          />
        )}
      </View>
      {dualData && (
        <Section
          title={t('recovery.strainVsRecovery')}
          subtitle={t('recovery.strainVsRecoveryDesc')}
        >
          <SkiaDualAxisChart
            a={{
              values: dualData.left.map(p => p.value),
              color: theme.colors.strain,
              name: t('home.strain'),
              formatValue: v => String(Math.round(v * 10) / 10),
            }}
            b={{
              values: dualData.right.map(p => p.value),
              color: theme.colors.recovery,
              name: t('home.recovery'),
              formatValue: v => `${String(Math.round(v))}%`,
            }}
            xLabels={dualData.left.map(p => p.label)}
          />
        </Section>
      )}
    </>
  );
};
