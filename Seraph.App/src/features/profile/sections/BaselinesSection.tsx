import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { BaselineStat } from '../components/BaselineStat';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';

interface Baselines {
  baseline_hrv: number | null;
  baseline_rhr: number | null;
  date: string;
}

interface Props {
  baselines: Baselines | null | undefined;
}

export const BaselinesSection: React.FC<Props> = ({ baselines }) => {
  const { t, i18n } = useTranslation();

  return (
    <>
      <SafeText style={[sectionStyles.sectionTitle, styles.sectionGap]}>
        {t('settings.baselines')}
      </SafeText>
      <View style={sectionStyles.container}>
        {baselines ? (
          <>
            <View style={styles.baselineRow}>
              <BaselineStat
                label={t('settings.baselineHrv')}
                value={
                  baselines.baseline_hrv !== null
                    ? `${String(Math.round(baselines.baseline_hrv))} ms`
                    : '—'
                }
              />
              <BaselineStat
                label={t('settings.baselineRhr')}
                value={
                  baselines.baseline_rhr !== null
                    ? `${String(Math.round(baselines.baseline_rhr))} bpm`
                    : '—'
                }
              />
            </View>
            <SafeText style={styles.baselineDate}>
              {t('settings.baselinesDate', {
                date: new Date(baselines.date + 'T12:00:00Z').toLocaleDateString(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                }),
              })}
            </SafeText>
          </>
        ) : (
          <SafeText style={styles.noData}>{t('settings.noBaselines')}</SafeText>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionGap: {
    marginTop: theme.spacing.lg,
  },
  baselineRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  baselineDate: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  noData: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    paddingVertical: theme.spacing.md,
    textAlign: 'center',
  },
});
