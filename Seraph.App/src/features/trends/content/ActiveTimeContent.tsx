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

export const ActiveTimeContent: React.FC<TrendContentProps> = ({
  range,
  onRangeChange,
  anchorDate,
  theme,
}) => {
  const s = buildTrendSharedStyles(theme);
  const sectionStyles = buildSectionStyles(theme);
  const { data, isLoading } = useTrendData('active_minutes', range, anchorDate);
  const points = data?.points ?? [];
  const summary = data?.summary ?? null;
  return (
    <>
      <TrendRangeControl
        range={range}
        color={theme.colors.active}
        tint={theme.colors.iconTint.active}
        anchorDate={anchorDate}
        onRangeChange={onRangeChange}
      />
      <HelperText translationKey="trends.helper_activeTime" />
      <View style={sectionStyles.container}>
        {summary && (
          <TrendSummaryRow
            summary={summary}
            color={theme.colors.active}
            unit=" min"
            fmt={fmtInteger}
          />
        )}
        {isLoading ? (
          <View style={s.loading}>
            <ActivityIndicator color={theme.colors.active} />
          </View>
        ) : (
          <TrendChart
            points={points}
            color={theme.colors.active}
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
