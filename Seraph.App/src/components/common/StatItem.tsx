import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from './SafeText';
import { theme } from '../../theme';

export interface StatItemProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

export const StatItem: React.FC<StatItemProps> = ({ iconName, label, value }) => (
  <View style={styles.statItem}>
    <View style={styles.statLabelRow}>
      <Ionicons name={iconName} size={12} color={theme.colors.text.muted} />
      <SafeText style={styles.statLabel}> {label}</SafeText>
    </View>
    <SafeText style={styles.statValue}>{value}</SafeText>
  </View>
);

const styles = StyleSheet.create({
  statItem: {},
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  statValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
});
