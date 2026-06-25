import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { formatDuration } from '../../../utils/dateUtils';
import type { SleepNeedFactors as SleepNeedFactorsData } from '../hooks/useSleepNeedFactors';

type DisplayMode = 'full' | 'goalOnly';

const FactorRow: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
  dimmed?: boolean;
}> = ({ icon, iconColor, label, value, dimmed }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconDot,
          { backgroundColor: iconColor + '22', borderColor: iconColor + '44' },
        ]}
      >
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <SafeText style={[styles.rowLabel, dimmed === true && styles.dimmed]}>{label}</SafeText>
      <SafeText style={[styles.rowValue, dimmed === true && styles.dimmed]}>{value}</SafeText>
    </View>
  );
};

export const SleepNeedFactors: React.FC<SleepNeedFactorsData & { displayMode?: DisplayMode }> = ({
  goalMinutes,
  debtAdjMinutes,
  strainAdjMinutes,
  totalMinutes,
  displayMode = 'full',
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  const goalRow = (
    <FactorRow
      icon="moon-outline"
      iconColor={theme.colors.sleep}
      label={t('alarm.sleepGoal')}
      value={formatDuration(goalMinutes * 60_000)}
    />
  );

  if (displayMode === 'goalOnly') {
    return goalRow;
  }

  return (
    <>
      {goalRow}
      <FactorRow
        icon="trending-up-outline"
        iconColor={debtAdjMinutes ? theme.colors.warning : theme.colors.text.muted}
        label={t('alarm.debtAdj')}
        value={
          debtAdjMinutes
            ? t('alarm.adjValue', { duration: formatDuration(debtAdjMinutes * 60_000) })
            : t('alarm.adjNone')
        }
        dimmed={!debtAdjMinutes}
      />
      <FactorRow
        icon="barbell-outline"
        iconColor={strainAdjMinutes ? theme.colors.strain : theme.colors.text.muted}
        label={t('alarm.strainAdj')}
        value={
          strainAdjMinutes
            ? t('alarm.adjValue', { duration: formatDuration(strainAdjMinutes * 60_000) })
            : t('alarm.adjNone')
        }
        dimmed={!strainAdjMinutes}
      />
      <View style={styles.totalRow}>
        <SafeText style={styles.totalLabel}>{t('alarm.tonight')}</SafeText>
        <SafeText style={styles.totalValue}>{formatDuration(totalMinutes * 60_000)}</SafeText>
      </View>
    </>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconDot: {
      width: 26,
      height: 26,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    rowValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    dimmed: {
      opacity: 0.4,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 2,
    },
    totalLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.sleep,
    },
    totalValue: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.sleep,
    },
  });
}
