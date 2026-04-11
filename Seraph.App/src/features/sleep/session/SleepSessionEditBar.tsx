import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

interface Props {
  startLabel: string;
  endLabel: string;
  dirty: boolean;
  saving: boolean;
  onStartPress: () => void;
  onEndPress: () => void;
  onSave: () => void;
}

export const SleepSessionEditBar: React.FC<Props> = ({
  startLabel,
  endLabel,
  dirty,
  saving,
  onStartPress,
  onEndPress,
  onSave,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onStartPress} activeOpacity={0.7} style={styles.timeItem}>
        <SafeText style={styles.label}>{t('sleep.bedtime')}</SafeText>
        <SafeText style={styles.value}>{startLabel}</SafeText>
      </TouchableOpacity>
      <SafeText style={styles.sep}>–</SafeText>
      <TouchableOpacity onPress={onEndPress} activeOpacity={0.7} style={styles.timeItem}>
        <SafeText style={styles.label}>{t('sleep.wake')}</SafeText>
        <SafeText style={styles.value}>{endLabel}</SafeText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSave}
        activeOpacity={0.7}
        disabled={!dirty || saving}
        style={[styles.saveBtn, (!dirty || saving) && styles.disabled]}
      >
        <SafeText style={styles.saveBtnText}>{t('sleep.save')}</SafeText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  timeItem: {
    alignItems: 'center',
    gap: 2,
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
    color: theme.colors.sleep,
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
    backgroundColor: theme.colors.sleep,
  },
  saveBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: '#000',
  },
  disabled: { opacity: 0.4 },
});
