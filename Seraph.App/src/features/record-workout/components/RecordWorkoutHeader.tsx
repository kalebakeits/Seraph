import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';

interface Props {
  sport: string;
  canChangeSport: boolean;
  onSportPress: () => void;
  onClose: () => void;
  closeDisabled: boolean;
}

export const RecordWorkoutHeader: React.FC<Props> = ({
  sport,
  canChangeSport,
  onSportPress,
  onClose,
  closeDisabled,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.sportBtn}
        activeOpacity={0.7}
        onPress={onSportPress}
        disabled={!canChangeSport}
      >
        <Ionicons name="barbell-outline" size={16} color={theme.colors.strain} />
        <SafeText style={styles.sportLabel}>{sport}</SafeText>
        {canChangeSport && (
          <Ionicons name="chevron-down" size={14} color={theme.colors.text.muted} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        style={styles.closeBtn}
        activeOpacity={0.7}
        disabled={closeDisabled}
      >
        <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    sportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.smx,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.error,
      backgroundColor: theme.colors.overlay.faint,
    },
    sportLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.strain,
    },
    closeBtn: { padding: theme.spacing.xs },
  });
}
