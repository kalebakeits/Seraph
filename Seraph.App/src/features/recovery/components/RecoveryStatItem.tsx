import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

const ARROW: Record<
  string,
  { name: React.ComponentProps<typeof Ionicons>['name']; color: string }
> = {
  up: { name: 'arrow-up', color: theme.colors.recovery },
  down: { name: 'arrow-down', color: theme.colors.error },
  flat: { name: 'remove-outline', color: theme.colors.text.muted },
};

export interface RecoveryStatItemProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  baseline?: string;
  direction?: 'up' | 'down' | 'flat' | null;
  favorable?: boolean | null;
}

export const RecoveryStatItem: React.FC<RecoveryStatItemProps> = ({
  iconName,
  label,
  value,
  baseline,
  direction,
  favorable,
}) => {
  let arrowColor: string;

  if (favorable === null) {
    arrowColor = theme.colors.text.muted;
  } else if (favorable) {
    arrowColor = theme.colors.recovery;
  } else {
    arrowColor = theme.colors.error;
  }
  return (
    <View style={styles.statItem}>
      <View style={styles.statLabelRow}>
        <Ionicons name={iconName} size={12} color={theme.colors.text.muted} />
        <SafeText style={styles.statLabel}> {label}</SafeText>
      </View>
      <View style={styles.statValueRow}>
        <SafeText style={styles.statValue}>{value}</SafeText>
        {direction && direction !== 'flat' && (
          <Ionicons name={ARROW[direction].name} size={11} color={arrowColor} />
        )}
      </View>
      <SafeText style={styles.baseline}>{baseline}</SafeText>
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
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  baseline: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
});
