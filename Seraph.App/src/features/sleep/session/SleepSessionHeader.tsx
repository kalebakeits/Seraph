import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { formatDateHeader } from '../../../utils/dateUtils';

interface Props {
  date: string; // ISO yyyy-mm-dd
  onEditPress: () => void;
  onDeletePress: () => void;
  editing: boolean;
  disabled?: boolean;
}

export const SleepSessionHeader: React.FC<Props> = ({
  date,
  onEditPress,
  onDeletePress,
  editing,
  disabled,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      <SafeText style={styles.date}>{formatDateHeader(date)}</SafeText>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEditPress} style={styles.btn} activeOpacity={0.7}>
          <Ionicons
            name="pencil-outline"
            size={20}
            color={editing ? theme.colors.sleep : theme.colors.text.secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDeletePress}
          style={styles.btn}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    date: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    btn: {
      padding: theme.spacing.xs,
    },
  });
}
