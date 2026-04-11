import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';

interface Props {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export const SaveDiscardSheet: React.FC<Props> = ({ visible, onSave, onDiscard }) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <SafeText style={styles.title}>{t('workout.finishedTitle')}</SafeText>
          <SafeText style={styles.subtitle}>{t('workout.finishedMessage')}</SafeText>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={onSave}>
            <SafeText style={styles.saveLabel}>{t('workout.saveWorkout')}</SafeText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.discardBtn} activeOpacity={0.8} onPress={onDiscard}>
            <SafeText style={styles.discardLabel}>{t('workout.discard')}</SafeText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: theme.colors.surface.sheet,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  saveBtn: {
    width: '100%',
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.strain,
    alignItems: 'center',
  },
  saveLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: '#000',
  },
  discardBtn: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  discardLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.muted,
  },
});
