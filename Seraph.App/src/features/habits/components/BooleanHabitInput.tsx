import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';

interface BooleanHabitInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export const BooleanHabitInput: React.FC<BooleanHabitInputProps> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  const handlePress = (selected: number) => {
    onChange(value === selected ? null : selected);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, value === 1 && styles.btnActive]}
        onPress={() => {
          handlePress(1);
        }}
        activeOpacity={0.7}
      >
        <SafeText style={[styles.btnText, value === 1 && styles.btnTextActive]}>
          {t('common.yes')}
        </SafeText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, value === 0 && styles.btnActive]}
        onPress={() => {
          handlePress(0);
        }}
        activeOpacity={0.7}
      >
        <SafeText style={[styles.btnText, value === 0 && styles.btnTextActive]}>
          {t('common.no')}
        </SafeText>
      </TouchableOpacity>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    btn: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.overlay.light,
    },
    btnActive: {
      backgroundColor: theme.colors.recovery,
      borderColor: theme.colors.recovery,
    },
    btnText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.weights.semibold,
    },
    btnTextActive: {
      color: theme.colors.icon.onLight,
    },
  });
}
