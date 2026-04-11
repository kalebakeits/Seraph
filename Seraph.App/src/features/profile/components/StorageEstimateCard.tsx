import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';
import { estimatedMbPerDay, type GranularitySeconds } from '../utils/storageUtils';

interface Props {
  granularity: GranularitySeconds;
}

export const StorageEstimateCard: React.FC<Props> = ({ granularity }) => {
  const { t } = useTranslation();
  const mbPerDay = estimatedMbPerDay(granularity);
  const mbPerYear = mbPerDay * 365;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SafeText style={styles.label}>{t('settings.storage.estimatePerDay')}</SafeText>
        <SafeText style={styles.value}>
          {t('settings.storage.mbValue', { value: mbPerDay.toFixed(1) })}
        </SafeText>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <SafeText style={styles.label}>{t('settings.storage.estimatePerYear')}</SafeText>
        <SafeText style={styles.value}>
          {t('settings.storage.mbValue', { value: mbPerYear.toFixed(0) })}
        </SafeText>
      </View>
      <SafeText style={styles.note}>{t('settings.storage.estimateNote')}</SafeText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  value: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  note: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.sm,
    lineHeight: 16,
  },
});
