import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

interface Props {
  label: string;
  value: string;
}

export const BaselineStat: React.FC<Props> = ({ label, value }) => (
  <View style={styles.baselineStat}>
    <SafeText style={styles.baselineStatValue}>{value}</SafeText>
    <SafeText style={styles.baselineStatLabel}>{label}</SafeText>
  </View>
);

const styles = StyleSheet.create({
  baselineStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    gap: 2,
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
