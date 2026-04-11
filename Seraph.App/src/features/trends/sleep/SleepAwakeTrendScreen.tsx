import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { useSleepAwakeTrend } from './useSleepAwakeTrend';
import { trendSharedStyles as s } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { fmtInteger } from '../shared/trendFormatUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendSleepAwake'>;

const COLOR = theme.colors.sleep;
const UNIT = ' min';

export const SleepAwakeTrendScreen: React.FC<Props> = ({ route }) => {
  const { anchorDate } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useSleepAwakeTrend(range, anchorDate);

  const points = data?.points ?? [];
  const summary = data?.summary ?? null;

  return (
    <View style={[s.container, { paddingTop: insets.top + 48 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TrendRangeControl
          range={range}
          color={COLOR}
          anchorDate={anchorDate}
          onRangeChange={setRange}
        />
        <HelperText translationKey="trends.helper_sleepAwake" />
        <View style={sectionStyles.container}>
          {summary && (
            <TrendSummaryRow summary={summary} color={COLOR} unit={UNIT} fmt={fmtInteger} />
          )}
          {isLoading ? (
            <View style={s.loading}>
              <ActivityIndicator color={COLOR} />
            </View>
          ) : (
            <TrendChart
              points={points}
              color={COLOR}
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
