import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { BooleanHabitInput } from './BooleanHabitInput';
import { StepperHabitInput } from './StepperHabitInput';
import { useTheme, type Theme } from '../../../theme';
import type { HabitDefinition } from '../../../services/database/drizzle/schema';

interface HabitRowProps {
  habit: HabitDefinition;
  value: number | null;
  onChange: (habitId: number, value: number | null) => void;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, value, onChange }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  const label = habit.is_manual === 1 ? (habit.name_custom ?? '') : t(habit.name_key ?? '');
  const unit =
    habit.unit != null ? t(`habits.unit.${habit.unit}`, { defaultValue: habit.unit }) : null;

  const handleChange = (v: number | null) => {
    onChange(habit.id, v);
  };

  return (
    <View style={styles.row}>
      <View style={styles.labelWrap}>
        <SafeText style={styles.label} numberOfLines={1}>
          {label}
        </SafeText>
        {habit.type !== 'boolean' && unit != null && (
          <SafeText style={styles.unit}>{unit}</SafeText>
        )}
      </View>
      {habit.type === 'boolean' && <BooleanHabitInput value={value} onChange={handleChange} />}
      {habit.type === 'count' && (
        <StepperHabitInput value={value} step={habit.step ?? 1} onChange={handleChange} />
      )}
      {habit.type === 'duration' && (
        <StepperHabitInput value={value} step={habit.step ?? 5} onChange={handleChange} />
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.overlay.light,
    },
    labelWrap: {
      flex: 1,
      marginRight: theme.spacing.md,
      gap: theme.spacing.xxs,
    },
    label: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
    },
    unit: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
  });
}
