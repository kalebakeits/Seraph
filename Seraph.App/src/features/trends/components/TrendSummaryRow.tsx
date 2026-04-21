import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { useTheme } from '../../../theme';
import type { TrendSummary } from '../useTrendData';

interface Props {
  summary: TrendSummary;
  color: string;
  unit: string;
  fmt: (v: number) => string;
}

export const TrendSummaryRow: React.FC<Props> = ({ summary, color, unit: _unit, fmt }) => {
  const { theme } = useTheme();
  const s = useMemo(() => buildTrendSharedStyles(theme), [theme]);
  const { t } = useTranslation();
  return (
    <View style={s.summaryRow}>
      <View style={s.summaryItem}>
        <SafeText style={s.summaryLabel}>{t('trends.min')}</SafeText>
        <SafeText style={[s.summaryValue, { color }]}>
          {summary.min !== null ? fmt(summary.min) : '--'}
        </SafeText>
      </View>
      <View style={s.summaryItem}>
        <SafeText style={s.summaryLabel}>{t('trends.avg')}</SafeText>
        <SafeText style={[s.summaryValue, { color }]}>
          {summary.avg !== null ? fmt(summary.avg) : '--'}
        </SafeText>
      </View>
      <View style={s.summaryItem}>
        <SafeText style={s.summaryLabel}>{t('trends.max')}</SafeText>
        <SafeText style={[s.summaryValue, { color }]}>
          {summary.max !== null ? fmt(summary.max) : '--'}
        </SafeText>
      </View>
    </View>
  );
};
