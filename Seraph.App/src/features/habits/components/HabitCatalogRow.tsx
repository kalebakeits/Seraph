import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';
import type { HabitDefinition } from '../../../services/database/drizzle/schema';

interface HabitCatalogRowProps {
  habit: HabitDefinition;
  onToggle: (id: number, active: boolean) => void;
}

export const HabitCatalogRow: React.FC<HabitCatalogRowProps> = ({ habit, onToggle }) => {
  const { t } = useTranslation();
  const active = habit.is_active === 1;

  const label = habit.is_manual === 1 ? habit.name_custom ?? '' : t(habit.name_key ?? '');

  const typeLabel = t(`habits.type.${habit.type}`);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        onToggle(habit.id, !active);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.text}>
        <SafeText style={styles.label}>{label}</SafeText>
        <SafeText style={styles.meta}>
          {typeLabel}
          {habit.unit ? ` · ${habit.unit}` : ''}
        </SafeText>
      </View>
      <View style={[styles.check, active && styles.checkActive]}>
        {active && <Ionicons name="checkmark" size={16} color="#000" />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  meta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: theme.colors.recovery,
    borderColor: theme.colors.recovery,
  },
});
