import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useActivityStats } from '../../hooks/useActivityStats';
import { Section } from '../../../../components/common/Section';
import { MetricCard } from './MetricCard';
import { theme } from '../../../../theme';

interface DailyStatsProps {
  selectedDate?: string;
}

export const DailyStats: React.FC<DailyStatsProps> = ({ selectedDate }) => {
  const { t } = useTranslation();
  const { data } = useActivityStats(selectedDate);
  const today = data?.today ?? {
    steps: null,
    activeMinutes: null,
    hrv: null,
    rhr: null,
    skinTemp: null,
    dailyStress: null,
  };
  const sevenDayAvg = data?.sevenDayAvg ?? {
    steps: null,
    activeMinutes: null,
    hrv: null,
    rhr: null,
    skinTemp: null,
    dailyStress: null,
  };

  return (
    <Section title={t('home.dailyStats')}>
      <View style={styles.grid}>
        <MetricCard
          iconName="footsteps-outline"
          iconColor={theme.colors.steps}
          label={t('home.steps')}
          current={today.steps}
          previous={sevenDayAvg.steps !== null ? Math.round(sevenDayAvg.steps) : null}
          unit=""
          trendRoute="TrendSteps"
          anchorDate={selectedDate}
        />
        <MetricCard
          iconName="walk-outline"
          iconColor={theme.colors.active}
          label={t('home.activeTime')}
          current={today.activeMinutes}
          previous={
            sevenDayAvg.activeMinutes !== null ? Math.round(sevenDayAvg.activeMinutes) : null
          }
          unit=" min"
          trendRoute="TrendActiveTime"
          anchorDate={selectedDate}
        />
        <MetricCard
          iconName="pulse-outline"
          iconColor={theme.colors.recovery}
          label={t('home.hrv')}
          current={today.hrv}
          previous={sevenDayAvg.hrv !== null ? Math.round(sevenDayAvg.hrv) : null}
          unit=" ms"
          trendRoute="TrendHrv"
          anchorDate={selectedDate}
        />
        <MetricCard
          iconName="heart-outline"
          iconColor={theme.colors.strain}
          label={t('home.rhr')}
          current={today.rhr}
          previous={sevenDayAvg.rhr !== null ? Math.round(sevenDayAvg.rhr) : null}
          unit=" bpm"
          trendRoute="TrendHr"
          anchorDate={selectedDate}
        />
        <MetricCard
          iconName="thermometer-outline"
          iconColor={theme.colors.skinTemp}
          label={t('home.skinTemp')}
          current={today.skinTemp}
          previous={sevenDayAvg.skinTemp}
          unit="°C"
          format={v => v.toFixed(1)}
          trendRoute="TrendSkinTemp"
          anchorDate={selectedDate}
        />
        <MetricCard
          iconName="body-outline"
          iconColor={theme.colors.recovery}
          label={t('home.dailyStress')}
          current={today.dailyStress ?? 0}
          previous={sevenDayAvg.dailyStress !== null ? Math.round(sevenDayAvg.dailyStress) : null}
          unit=""
          trendRoute="TrendDailyStress"
          anchorDate={selectedDate}
        />
      </View>
    </Section>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
});
