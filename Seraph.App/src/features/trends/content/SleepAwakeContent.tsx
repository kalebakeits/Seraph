import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { HelperText } from '../../../components/common/HelperText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { fmtInteger } from '../shared/trendFormatUtils';
import { useSleepAwakeTrend } from '../sleep/useSleepAwakeTrend';
import type { TrendContentProps } from '../TrendTypes';

export const SleepAwakeContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useSleepAwakeTrend(range, anchorDate);
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
      <HelperText translationKey="trends.helper_sleepAwake" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow
            summary={summary}
            color={theme.colors.sleep}
            unit=" min"
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
            unit=" min"
            range={range}
            format={fmtInteger}
            summary={summary}
          />
        )}
      </View>
    </>
  );
};
