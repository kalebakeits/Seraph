import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';

interface Props {
  label: string;
  value: string;
}

export const BaselineStat: React.FC<Props> = ({ label, value }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <View style={styles.baselineStat}>
      <SafeText style={styles.baselineStatValue}>{value}</SafeText>
      <SafeText style={styles.baselineStatLabel}>{label}</SafeText>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    baselineStat: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.overlay.ghost,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xxs,
    },
    baselineStatValue: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    baselineStatLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
  });
}
