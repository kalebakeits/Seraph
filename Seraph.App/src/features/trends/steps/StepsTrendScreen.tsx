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

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendSteps'>;

export const StepsTrendScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const s = buildTrendSharedStyles(theme);
  const { anchorDate } = route.params ?? {};
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useTrendData('steps', range, anchorDate);

  const points = data?.points ?? [];
  const summary = data?.summary ?? null;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TrendRangeControl
          range={range}
          color={theme.colors.steps}
          tint={theme.colors.iconTint.steps}
          anchorDate={anchorDate}
          onRangeChange={setRange}
        />
        <HelperText translationKey="trends.helper_steps" />
        <View style={sectionStyles.container}>
          {summary && (
            <TrendSummaryRow
              summary={summary}
              color={theme.colors.steps}
              unit=""
              fmt={fmtInteger}
            />
          )}
          {isLoading ? (
            <View style={s.loading}>
              <ActivityIndicator color={theme.colors.steps} />
            </View>
          ) : (
            <TrendChart
              points={points}
              color={theme.colors.steps}
              unit=""
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
