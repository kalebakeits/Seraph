import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme, type Theme } from '../../theme';

interface Props {
  startLabel: string;
  endLabel: string;
  dirty: boolean;
  saving: boolean;
  onStartPress: () => void;
  onEndPress: () => void;
  onSave: () => void;
}

export const WorkoutEditBar: React.FC<Props> = ({
  startLabel,
  endLabel,
  dirty,
  saving,
  onStartPress,
  onEndPress,
  onSave,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onStartPress} activeOpacity={0.7} style={styles.timeItem}>
        <SafeText style={styles.label}>{t('workout.start')}</SafeText>
        <SafeText style={styles.value}>{startLabel}</SafeText>
      </TouchableOpacity>
      <SafeText style={styles.sep}>–</SafeText>
      <TouchableOpacity onPress={onEndPress} activeOpacity={0.7} style={styles.timeItem}>
        <SafeText style={styles.label}>{t('workout.end')}</SafeText>
        <SafeText style={styles.value}>{endLabel}</SafeText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSave}
        activeOpacity={0.7}
        disabled={!dirty || saving}
        style={[styles.saveBtn, (!dirty || saving) && styles.disabled]}
      >
        <SafeText style={styles.saveBtnText}>{t('workout.save')}</SafeText>
      </TouchableOpacity>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    timeItem: {
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
    label: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    value: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.active,
    },
    sep: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.sm,
    },
    saveBtn: {
      marginLeft: 'auto',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.active,
    },
    saveBtnText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.icon.onLight,
    },
    disabled: { opacity: 0.4 },
  });
}
