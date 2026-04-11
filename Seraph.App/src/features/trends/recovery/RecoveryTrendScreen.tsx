import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { Section } from '../../../components/common/Section';
import { theme } from '../../../theme';
import { TrendRangeControl } from '../components/TrendRangeControl';
import { TrendSummaryRow } from '../components/TrendSummaryRow';
import { TrendChart } from '../TrendChart';
import { useTrendData } from '../useTrendData';
import { RecoveryBars } from '../../recovery/components/RecoveryBars';
import { useRecoveryHistory } from '../../recovery/hooks/useRecoveryHistory';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { useStrainRecoveryTrend } from '../shared/useStrainRecoveryTrend';
import { trendSharedStyles as s } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { fmtInteger } from '../shared/trendFormatUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendRecovery'>;

const COLOR = theme.colors.recovery;
const UNIT = '%';

export const RecoveryTrendScreen: React.FC<Props> = ({ route }) => {
  const { anchorDate } = route.params ?? {};
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useTrendData('recovery', range, anchorDate);
  const { data: history = [] } = useRecoveryHistory(anchorDate);
  const { data: dualData } = useStrainRecoveryTrend(anchorDate);

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
        <HelperText translationKey="trends.helper_recovery" />
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
      </ScrollView>
    </View>
  );
};
