import React, { useMemo } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { StepperHabitInput } from '../../habits/components/StepperHabitInput';
import { useTheme, type Theme } from '../../../theme';
import type { AutoPauseSettings } from '../hooks/useAutoPauseSettings';
import { getZ1Threshold } from '../../../utils/hrThreshold';

interface Props {
  settings: AutoPauseSettings;
  onToggle: (value: boolean) => void;
  onZ1Change: (value: number) => void;
}

export const AutoPausePanel: React.FC<Props> = ({ settings, onToggle, onZ1Change }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  const z1Threshold = Math.round(getZ1Threshold(settings.fthr, settings.age));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SafeText style={styles.label}>{t('workout.autoPauseToggle')}</SafeText>
        <Switch
          value={settings.enabled}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.overlay.medium, true: theme.colors.strain }}
          thumbColor={theme.colors.thumb}
        />
      </View>

      <SafeText style={styles.helper}>
        {t('workout.autoPauseHelper', { threshold: z1Threshold })}
      </SafeText>

      {settings.enabled && (
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('workout.autoPauseDelay')}</SafeText>
          <View style={styles.stepperRow}>
            <StepperHabitInput
              value={settings.z1Seconds}
              step={10}
              onChange={v => {
                if (v != null && v > 0) onZ1Change(v);
              }}
            />
            <SafeText style={styles.unit}>{t('workout.autoPauseDelayUnit')}</SafeText>
          </View>
        </View>
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    helper: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    unit: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
  });
}
