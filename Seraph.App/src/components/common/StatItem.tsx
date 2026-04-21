import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from './SafeText';
import { useTheme } from '../../theme';

export interface StatItemProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

export const StatItem: React.FC<StatItemProps> = ({ iconName, label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.statItem}>
      <View style={styles.statLabelRow}>
        <Ionicons name={iconName} size={12} color={theme.colors.text.muted} />
        <SafeText style={[styles.statLabel, { color: theme.colors.text.muted }]}> {label}</SafeText>
      </View>
      <SafeText style={[styles.statValue, { color: theme.colors.text.primary }]}>{value}</SafeText>
    </View>
  );
};

const styles = StyleSheet.create({
  statItem: {},
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
