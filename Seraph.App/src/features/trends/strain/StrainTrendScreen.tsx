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
import { StrainBars } from '../../strain/components/StrainBars';
import { SkiaDualAxisChart } from '../../../components/common/SkiaDualAxisChart';
import { useStrainRecoveryTrend } from '../shared/useStrainRecoveryTrend';
import { useStrainRhrTrend } from '../shared/useStrainRhrTrend';
import { useStrainSleepTrend } from '../shared/useStrainSleepTrend';
import { trendSharedStyles as s } from '../shared/TrendSharedStyles';
import { HelperText } from '../../../components/common/HelperText';
import { fmtDecimal1, fmtInteger } from '../shared/trendFormatUtils';
import { formatDuration } from '../../../utils/dateUtils';
import type { TrendRange } from '../useTrendData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrendStrain'>;

const COLOR = theme.colors.strain;

export const StrainTrendScreen: React.FC<Props> = ({ route }) => {
  const { anchorDate } = route.params ?? {};
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>('1W');
  const { data, isLoading } = useTrendData('strain', range, anchorDate);
  const { data: recoveryDual } = useStrainRecoveryTrend(anchorDate);
  const { data: sleepDual } = useStrainSleepTrend(anchorDate);
  const { data: rhrDual } = useStrainRhrTrend(anchorDate);

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
        <HelperText translationKey="trends.helper_strain" />
        <View style={sectionStyles.container}>
          {summary && <TrendSummaryRow summary={summary} color={COLOR} unit="" fmt={fmtDecimal1} />}
          {isLoading ? (
            <View style={s.loading}>
              <ActivityIndicator color={COLOR} />
            </View>
          ) : (
            <TrendChart
              points={points}
              color={COLOR}
              unit=""
              range={range}
              format={fmtDecimal1}
              summary={summary}
              weekChart={<StrainBars anchorDate={anchorDate} />}
            />
          )}
        </View>
        {recoveryDual && (
          <Section
            title={t('recovery.strainVsRecovery')}
            subtitle={t('recovery.strainVsRecoveryDesc')}
          >
            <SkiaDualAxisChart
              a={{
                values: recoveryDual.left.map(p => p.value),
                color: COLOR,
                name: t('home.strain'),
                formatValue: v => String(Math.round(v * 10) / 10),
              }}
              b={{
                values: recoveryDual.right.map(p => p.value),
                color: theme.colors.recovery,
                name: t('home.recovery'),
                formatValue: v => `${String(Math.round(v))}%`,
              }}
              xLabels={recoveryDual.left.map(p => p.label)}
            />
          </Section>
        )}
        {sleepDual && (
          <Section title={t('sleep.strainVsSleep')} subtitle={t('sleep.strainVsSleepDesc')}>
            <SkiaDualAxisChart
              a={{
                values: sleepDual.left.map(p => p.value),
                color: COLOR,
                name: t('home.strain'),
                formatValue: v => String(Math.round(v * 10) / 10),
              }}
              b={{
                values: sleepDual.right.map(p => p.value),
                color: theme.colors.sleep,
                name: t('home.sleep'),
                formatValue: v => formatDuration(Math.round(v) * 60_000),
              }}
              xLabels={sleepDual.left.map(p => p.label)}
            />
          </Section>
        )}
        {rhrDual && (
          <Section title={t('trends.strainVsRhr')} subtitle={t('trends.strainVsRhrDesc')}>
            <SkiaDualAxisChart
              a={{
                values: rhrDual.left.map(p => p.value),
                color: COLOR,
                name: t('home.strain'),
                formatValue: v => String(Math.round(v * 10) / 10),
              }}
              b={{
                values: rhrDual.right.map(p => p.value),
                color: theme.colors.sleep,
                name: t('trends.rhr'),
                formatValue: v => `${fmtInteger(v)} bpm`,
              }}
              xLabels={rhrDual.left.map(p => p.label)}
            />
          </Section>
        )}
      </ScrollView>
    </View>
  );
};
