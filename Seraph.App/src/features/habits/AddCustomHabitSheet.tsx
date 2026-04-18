import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../components/common/SafeText';
import { habitDefinitionsRepository } from '../../services/database/drizzle';
import { useTheme, type Theme } from '../../theme';
import type { HabitType } from '../../services/database/drizzle/schema';

interface AddCustomHabitSheetProps {
  onClose: () => void;
}

const TYPES: { key: HabitType; labelKey: string }[] = [
  { key: 'boolean', labelKey: 'habits.type.boolean' },
  { key: 'count', labelKey: 'habits.type.count' },
  { key: 'duration', labelKey: 'habits.type.duration' },
];

export const AddCustomHabitSheet: React.FC<AddCustomHabitSheetProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>('boolean');
  const [unit, setUnit] = useState('');
  const [stepText, setStepText] = useState('');
  const [saving, setSaving] = useState(false);

  const showUnitAndStep = type !== 'boolean';
  const defaultStep = type === 'duration' ? 5 : 1;
  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const parsedStep = parseFloat(stepText);
      await habitDefinitionsRepository.insertCustom({
        name: name.trim(),
        type,
        unit: unit.trim() || null,
        step: !isNaN(parsedStep) && parsedStep > 0 ? parsedStep : null,
      });
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <Pressable
            style={styles.sheet}
            onPress={e => {
              e.stopPropagation();
            }}
          >
            <View style={styles.header}>
              <SafeText style={styles.title}>{t('habits.addCustom')}</SafeText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Name */}
              <SafeText style={styles.fieldLabel}>{t('habits.customName')}</SafeText>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder={t('habits.customNamePlaceholder')}
                placeholderTextColor={theme.colors.text.muted}
                maxLength={60}
                autoFocus
              />

              {/* Type */}
              <SafeText style={styles.fieldLabel}>{t('habits.customType')}</SafeText>
              <View style={styles.typeRow}>
                {TYPES.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.typeBtn, type === opt.key && styles.typeBtnActive]}
                    onPress={() => {
                      setType(opt.key);
                    }}
                    activeOpacity={0.7}
                  >
                    <SafeText
                      style={[styles.typeBtnText, type === opt.key && styles.typeBtnTextActive]}
                    >
                      {t(opt.labelKey)}
                    </SafeText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Unit + Step — only for count/duration */}
              {showUnitAndStep && (
                <>
                  <SafeText style={styles.fieldLabel}>{t('habits.customUnit')}</SafeText>
                  <TextInput
                    style={styles.textInput}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder={
                      type === 'duration'
                        ? t('habits.customUnitPlaceholderDuration')
                        : t('habits.customUnitPlaceholderCount')
                    }
                    placeholderTextColor={theme.colors.text.muted}
                    maxLength={20}
                  />

                  <SafeText style={styles.fieldLabel}>
                    {t('habits.customStep', { default: defaultStep })}
                  </SafeText>
                  <TextInput
                    style={styles.textInput}
                    value={stepText}
                    onChangeText={setStepText}
                    placeholder={String(defaultStep)}
                    placeholderTextColor={theme.colors.text.muted}
                    keyboardType="numeric"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <SafeText style={styles.cancelText}>{t('common.cancel')}</SafeText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!canSave || saving) && styles.disabled]}
                onPress={() => void handleSave()}
                activeOpacity={0.7}
                disabled={!canSave || saving}
              >
                <SafeText style={styles.saveText}>{t('common.save')}</SafeText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.scrim.medium,
    },
    sheet: {
      backgroundColor: theme.colors.surface.sheet,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    closeBtn: {
      padding: theme.spacing.xs,
    },
    fieldLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    textInput: {
      backgroundColor: theme.colors.overlay.light,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
    },
    typeRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    typeBtn: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.overlay.medium,
      alignItems: 'center',
    },
    typeBtnActive: {
      backgroundColor: theme.colors.recovery,
      borderColor: theme.colors.recovery,
    },
    typeBtnText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.weights.semibold,
    },
    typeBtnTextActive: {
      color: theme.colors.icon.onLight,
    },
    buttons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.overlay.light,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.secondary,
    },
    saveBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.recovery,
      alignItems: 'center',
    },
    saveText: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.icon.onLight,
    },
    disabled: {
      opacity: 0.4,
    },
  });
}
