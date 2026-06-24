import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import type { SleepGoalMode } from '../../profile/ProfileSettingsTypes';

interface Props {
  mode: SleepGoalMode;
  onChange: (mode: SleepGoalMode) => void;
}

export const SleepGoalModePanel: React.FC<Props> = ({ mode, onChange }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <SafeText style={styles.label}>{t('alarm.sleepGoalCalculation')}</SafeText>
      <View style={styles.segmented}>
        {(['adaptive', 'fixed'] as SleepGoalMode[]).map((option, index) => {
          const active = mode === option;
          return (
            <Pressable
              key={option}
              style={[
                styles.segment,
                index === 0 && styles.segmentFirst,
                index === 1 && styles.segmentLast,
                active && styles.segmentActive,
              ]}
              onPress={() => {
                onChange(option);
              }}
            >
              <SafeText style={[styles.segmentText, active && styles.segmentTextActive]}>
                {t(`alarm.sleepGoalMode.${option}`)}
              </SafeText>
            </Pressable>
          );
        })}
      </View>
      <SafeText style={styles.helper}>{t(`alarm.sleepGoalMode.${mode}Hint`)}</SafeText>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    segmented: {
      flexDirection: 'row',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.overlay.medium,
      overflow: 'hidden',
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.overlay.dim,
    },
    segmentFirst: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: theme.colors.overlay.medium,
    },
    segmentLast: {},
    segmentActive: {
      backgroundColor: theme.colors.strain + '22',
    },
    segmentText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    segmentTextActive: {
      color: theme.colors.strain,
      fontWeight: theme.typography.weights.semibold,
    },
    helper: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
    },
  });
}
