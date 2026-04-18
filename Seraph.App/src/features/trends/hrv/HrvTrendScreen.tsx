import React, { useState, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTheme } from '../../../theme';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { useTrendData } from '../useTrendData';
import { buildTrendSharedStyles } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { fmtInteger } from '../shared/trendFormatUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendHrv'>;

const UNIT = ' ms';

export const HrvTrendScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const s = buildTrendSharedStyles(theme);
  const { anchorDate } = route.params ?? {};
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useTrendData('hrv_rmssd', range, anchorDate);

  const points = data?.points ?? [];
  const summary = data?.summary ?? null;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TrendRangeControl
          range={range}
          color={theme.colors.recovery}
          tint={theme.colors.iconTint.recovery}
          anchorDate={anchorDate}
          onRangeChange={setRange}
        />
        <HelperText translationKey="trends.helper_hrv" />
        <View style={sectionStyles.container}>
          {summary && (
            <TrendSummaryRow
              summary={summary}
              color={theme.colors.recovery}
              unit={UNIT}
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
              unit={UNIT}
              range={range}
              format={fmtInteger}
              summary={summary}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};
