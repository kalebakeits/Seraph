import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';

interface Props {
  date: string;
  editing: boolean;
  onEditPress: () => void;
  onDeletePress: () => void;
  disabled?: boolean;
}

export const WorkoutHeader: React.FC<Props> = ({
  date,
  editing,
  onEditPress,
  onDeletePress,
  disabled,
}) => (
  <View style={styles.row}>
    <SafeText style={styles.type}>{date}</SafeText>
    <View style={styles.actions}>
      <TouchableOpacity onPress={onEditPress} style={styles.btn} activeOpacity={0.7}>
        <Ionicons
          name="pencil-outline"
          size={20}
          color={editing ? theme.colors.active : theme.colors.text.secondary}
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  type: {
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
