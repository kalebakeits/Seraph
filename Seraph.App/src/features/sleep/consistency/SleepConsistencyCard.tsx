import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { useSleepConsistency } from '../hooks/useSleepConsistency';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { formatDecimalHour, formatDuration } from '../../../utils/dateUtils';

interface Props {
  anchorDate?: string;
}

export const SleepConsistencyCard: React.FC<Props> = ({ anchorDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  const { data } = useSleepConsistency(anchorDate);

  const bedRangeMin = data ? Math.round((data.bedtime.latest - data.bedtime.earliest) * 60) : null;
  const wakeRangeMin = data ? Math.round((data.wake.latest - data.wake.earliest) * 60) : null;
  const overallRange =
    bedRangeMin !== null && wakeRangeMin !== null
      ? Math.round((bedRangeMin + wakeRangeMin) / 2)
      : null;
  let consistencyKey: string | null = null;
  let consistencyColor: string = theme.colors.text.muted;

  if (overallRange !== null) {
    if (overallRange <= 30) {
      consistencyKey = 'sleep.veryConsistent';
      consistencyColor = theme.colors.recoveryColors.high;
    } else if (overallRange <= 90) {
      consistencyKey = 'sleep.consistent';
      consistencyColor = theme.colors.warning;
    } else {
      consistencyKey = 'sleep.inconsistent';
      consistencyColor = theme.colors.error;
    }
  }

  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Ionicons name="repeat-outline" size={18} color={theme.colors.sleep} />
        <SafeText style={sectionStyles.title}>{t('sleep.consistency')}</SafeText>
        {consistencyKey && (
          <View style={[styles.badge, { backgroundColor: consistencyColor + '33' }]}>
            <SafeText style={[styles.badgeText, { color: consistencyColor }]}>
              {t(consistencyKey)}
            </SafeText>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        {/* Bedtime */}
        <View style={styles.cell}>
          <SafeText style={styles.cellLabel}>{t('sleep.bedtime')}</SafeText>
          <SafeText style={styles.rangeText}>
            {data ? formatDecimalHour(data.bedtime.earliest) : '--'}
          </SafeText>
          <SafeText style={styles.avgText}>
            {data ? formatDecimalHour(data.bedtime.avg) : '--'}
          </SafeText>
          <SafeText style={styles.rangeText}>
            {data ? formatDecimalHour(data.bedtime.latest) : '--'}
          </SafeText>
        </View>

        {/* Wake */}
        <View style={styles.cell}>
          <SafeText style={styles.cellLabel}>{t('sleep.wake')}</SafeText>
          <SafeText style={styles.rangeText}>
            {data ? formatDecimalHour(data.wake.earliest) : '--'}
          </SafeText>
          <SafeText style={styles.avgText}>
            {data ? formatDecimalHour(data.wake.avg) : '--'}
          </SafeText>
          <SafeText style={styles.rangeText}>
            {data ? formatDecimalHour(data.wake.latest) : '--'}
          </SafeText>
        </View>

        {/* Duration */}
        <View style={styles.cell}>
          <SafeText style={styles.cellLabel}>{t('sleep.duration')}</SafeText>
          <SafeText style={styles.rangeText}> </SafeText>
          <SafeText style={styles.avgText}>
            {formatDuration(data?.avgDurationMin != null ? data.avgDurationMin * 60_000 : null)}
          </SafeText>
          <SafeText style={styles.rangeText}>
            {data ? t('sleep.nights', { count: data.nights.length }) : '--'}
          </SafeText>
        </View>
      </View>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    badgeText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
    },
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
    },
    cellLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    avgText: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
      marginVertical: theme.spacing.xxs,
    },
    rangeText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginVertical: 1,
    },
  });
}
