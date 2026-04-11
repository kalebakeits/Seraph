import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const BugReportSheet: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) return;
    Sentry.captureMessage(description.trim(), {
      level: 'info',
      tags: { source: 'user_report' },
    });
    setSubmitted(true);
  };

  const handleClose = () => {
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <Pressable
            style={styles.sheet}
            onPress={e => {
              e.stopPropagation();
            }}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons name="bug-outline" size={18} color={theme.colors.text.secondary} />
                <SafeText style={styles.title}>{t('settings.bugReportTitle')}</SafeText>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {submitted ? (
              <View style={styles.thankYou}>
                <Ionicons name="checkmark-circle-outline" size={40} color={theme.colors.active} />
                <SafeText style={styles.thankYouText}>{t('settings.bugReportThanks')}</SafeText>
              </View>
            ) : (
              <>
                <SafeText style={styles.hint}>{t('settings.bugReportSubtitle')}</SafeText>
                <TextInput
                  style={styles.input}
                  placeholder={t('settings.bugReportComments')}
                  placeholderTextColor={theme.colors.text.muted}
                  multiline
                  numberOfLines={5}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <SafeText style={styles.cancelText}>{t('common.cancel')}</SafeText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, !description.trim() && styles.disabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.7}
                    disabled={!description.trim()}
                  >
                    <SafeText style={styles.submitText}>{t('settings.bugReportSubmit')}</SafeText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.surface.sheet,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  hint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.overlay.light,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    padding: theme.spacing.md,
    minHeight: 120,
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
  submitBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.active,
    alignItems: 'center',
  },
  submitText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: '#000',
  },
  disabled: {
    opacity: 0.4,
  },
  thankYou: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  thankYouText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
