import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { HelperText } from '../../../components/common/HelperText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { fmtInteger } from '../shared/trendFormatUtils';
import { useTrendData } from '../useTrendData';
import type { TrendContentProps } from '../TrendTypes';

export const DailyStressContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useTrendData('daily_stress', range, anchorDate);
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
      <HelperText translationKey="trends.helper_dailyStress" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow
            summary={summary}
            color={theme.colors.recovery}
            unit=""
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
            unit=""
            range={range}
            format={fmtInteger}
            summary={summary}
          />
        )}
      </View>
    </>
  );
};
