import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeText } from '../../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../../theme';

export interface ActionRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onLongPress?: () => void;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  sublabel,
  onPress,
  destructive,
  disabled,
  loading,
  onLongPress,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const isInactive = disabled === true || loading === true;
  return (
    <TouchableOpacity
      style={[styles.actionRow, isInactive && styles.actionRowDisabled]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isInactive}
      activeOpacity={0.6}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? theme.colors.error : theme.colors.text.secondary}
        style={styles.actionRowIcon}
      />
      <View style={styles.actionRowText}>
        <SafeText style={[styles.actionRowLabel, destructive && { color: theme.colors.error }]}>
          {label}
        </SafeText>
        {sublabel ? <SafeText style={styles.actionRowSublabel}>{sublabel}</SafeText> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.text.muted} />
      ) : (
        <Ionicons name="chevron-forward" size={14} color={theme.colors.text.muted} />
      )}
    </TouchableOpacity>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 14,
      gap: theme.spacing.sm,
    },
    actionRowDisabled: { opacity: 0.4 },
    actionRowIcon: { width: 24, textAlign: 'center' },
    actionRowText: { flex: 1 },
    actionRowLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.weights.medium,
    },
    actionRowSublabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.xxs,
    },
  });
}
