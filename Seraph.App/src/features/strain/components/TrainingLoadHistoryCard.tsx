import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { SkiaBandChart } from '../../../components/common/SkiaBandChart';
import { useTheme, type Theme } from '../../../theme';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTrainingLoad } from '../hooks/useTrainingLoad';
import { PRODUCTIVE_MIN, PRODUCTIVE_MAX } from '../utils/trainingLoadUtils';

interface Props {
  anchorDate?: string;
}

export const TrainingLoadHistoryCard: React.FC<Props> = ({ anchorDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
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
        color={theme.colors.trainingLoad.overreaching}
        bandColor={theme.colors.trainingLoad.productive}
        noOfSections={3}
      />
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
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
      gap: theme.spacing.smx,
    },
    bandDot: {
      width: theme.layout.legendDotLg,
      height: theme.layout.legendDotLg,
      borderRadius: 2,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.trainingLoad.productive,
      borderStyle: 'dashed',
    },
    bandLabel: {
      fontSize: 10,
      color: theme.colors.text.muted,
    },
  });
}
