import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { SkiaBandChart } from '../../../components/common/SkiaBandChart';
import { theme } from '../../../theme';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { useTrainingLoad } from '../hooks/useTrainingLoad';
import { PRODUCTIVE_MIN, PRODUCTIVE_MAX } from '../utils/trainingLoadUtils';

interface Props {
  anchorDate?: string;
}

export const TrainingLoadHistoryCard: React.FC<Props> = ({ anchorDate }) => {
  const { t } = useTranslation();
  const { data } = useTrainingLoad(anchorDate);
  const { history } = data ?? { history: [] };

  const chartData = history.map(p => ({
    value: Math.round(p.atl),
    upper: Math.round(p.ctl * PRODUCTIVE_MAX),
    lower: Math.round(p.ctl * PRODUCTIVE_MIN),
    label: p.label,
  }));

  return (
    <View style={sectionStyles.container}>
      <View style={styles.headerRow}>
        <SafeText style={styles.title}>{t('strain.sevenDayLoad')}</SafeText>
        <View style={styles.bandLegend}>
          <View style={styles.bandDot} />
          <SafeText style={styles.bandLabel}>{t('strain.productiveZone')}</SafeText>
        </View>
      </View>
      <SkiaBandChart
        data={chartData}
        height={160}
        color="#f39c12"
        bandColor="#2ecc71"
        noOfSections={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  bandLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bandDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderStyle: 'dashed',
  },
  bandLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
});
