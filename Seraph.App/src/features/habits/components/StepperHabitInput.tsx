import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

interface StepperHabitInputProps {
  value: number | null;
  unit: string | null;
  step: number;
  onChange: (value: number | null) => void;
}

export const StepperHabitInput: React.FC<StepperHabitInputProps> = ({
  value,
  unit,
  step,
  onChange,
}) => {
  const displayed = value ?? 0;

  const increment = () => {
    onChange(displayed + step);
  };

  const decrement = () => {
    const next = displayed - step;
    onChange(next <= 0 ? null : next);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.iconBtn} onPress={decrement} activeOpacity={0.7}>
        <Ionicons
          name="remove-circle-outline"
          size={26}
          color={displayed > 0 ? theme.colors.text.primary : theme.colors.text.muted}
        />
      </TouchableOpacity>
      <View style={styles.valueWrap}>
        <SafeText style={styles.value}>{displayed > 0 ? String(displayed) : '—'}</SafeText>
        {unit && displayed > 0 && <SafeText style={styles.unit}>{unit}</SafeText>}
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={increment} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={26} color={theme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconBtn: {
    padding: 2,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    minWidth: 48,
    justifyContent: 'center',
  },
  value: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  unit: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
});
