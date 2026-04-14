import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { BooleanHabitInput } from './BooleanHabitInput';
import { StepperHabitInput } from './StepperHabitInput';
import { theme } from '../../../theme';
import type { HabitDefinition } from '../../../services/database/drizzle/schema';

interface HabitRowProps {
  habit: HabitDefinition;
  value: number | null;
  onChange: (habitId: number, value: number | null) => void;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, value, onChange }) => {
  const { t } = useTranslation();

  const label = habit.is_manual === 1 ? (habit.name_custom ?? '') : t(habit.name_key ?? '');

  const handleChange = (v: number | null) => {
    onChange(habit.id, v);
  };

  return (
    <View style={styles.row}>
      <SafeText style={styles.label} numberOfLines={1}>
        {label}
      </SafeText>
      {habit.type === 'boolean' && <BooleanHabitInput value={value} onChange={handleChange} />}
      {habit.type === 'count' && (
        <StepperHabitInput value={value} unit={habit.unit} step={1} onChange={handleChange} />
      )}
      {habit.type === 'duration' && (
        <StepperHabitInput value={value} unit={habit.unit} step={5} onChange={handleChange} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  label: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.md,
  },
});
