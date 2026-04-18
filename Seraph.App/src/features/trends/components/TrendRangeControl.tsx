import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { useTheme } from '../../../theme';
import { daysAgoISO, todayISO } from '../../../utils/dateUtils';
import type { TrendRange } from '../useTrendData';

const RANGES: TrendRange[] = ['1W', '1M', '6M'];

function rangeDays(range: TrendRange): number {
  if (range === '1W') return 6;
  if (range === '1M') return 30;
  return 182;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

interface Props {
  range: TrendRange;
  color: string;
  tint: string;
  anchorDate?: string;
  onRangeChange: (r: TrendRange) => void;
}

export const TrendRangeControl: React.FC<Props> = ({ range, color, tint, anchorDate, onRangeChange }) => {
  const { theme } = useTheme();
  const s = useMemo(() => buildTrendSharedStyles(theme), [theme]);
  const { t } = useTranslation();
  const anchor = anchorDate ?? todayISO();
  const from = daysAgoISO(rangeDays(range), anchor);
  const dateLabel = `${formatDateShort(from)} – ${formatDateShort(anchor)}`;

  const rangeLabels: Record<TrendRange, string> = {
    '1W': t('trends.range_1W'),
    '1M': t('trends.range_1M'),
    '6M': t('trends.range_6M'),
  };

  return (
    <View style={s.controlRow}>
      <View style={s.rangePills}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r}
            style={[s.rangeBtn, range === r && { borderColor: color, backgroundColor: tint }]}
            onPress={() => { onRangeChange(r); }}
            activeOpacity={0.7}
          >
            <SafeText style={[s.rangeBtnText, range === r && { color }]}>{rangeLabels[r]}</SafeText>
          </TouchableOpacity>
        ))}
      </View>
      <SafeText style={s.dateRange}>{dateLabel}</SafeText>
    </View>
  );
};
