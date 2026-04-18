import React, { useState, useMemo } from 'react';
import { Modal, View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeText } from '../../../../components/common/SafeText';
import { LogActivitySheet } from './LogActivitySheet';
import { useTheme, type Theme } from '../../../../theme';
import { ActivityType } from '../../../../types/ActivityType';
import { navigationRef } from '../../../../navigation/navigationRef';

interface ActivityActionSheetProps {
  selectedDate: string;
  onClose: () => void;
}

type SubSheet = 'sleep' | 'workout' | null;

export const ActivityActionSheet: React.FC<ActivityActionSheetProps> = ({
  selectedDate,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [subSheet, setSubSheet] = useState<SubSheet>(null);

  if (subSheet === 'sleep') {
    return (
      <LogActivitySheet
        selectedDate={selectedDate}
        initialType={ActivityType.Sleep}
        onClose={onClose}
      />
    );
  }

  if (subSheet === 'workout') {
    return (
      <LogActivitySheet
        selectedDate={selectedDate}
        initialType={ActivityType.Workout}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { marginBottom: insets.bottom + 12 }]}
          onPress={e => {
            e.stopPropagation();
          }}
        >
          <View style={styles.handle} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              setSubSheet('sleep');
            }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.iconTint.sleep, borderColor: theme.colors.sleep },
              ]}
            >
              <Ionicons name="moon-outline" size={20} color={theme.colors.sleep} />
            </View>
            <SafeText style={styles.actionLabel}>{t('activities.logSleep')}</SafeText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              setSubSheet('workout');
            }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.iconTint.active, borderColor: theme.colors.active },
              ]}
            >
              <Ionicons name="barbell-outline" size={20} color={theme.colors.active} />
            </View>
            <SafeText style={styles.actionLabel}>{t('activities.logWorkout')}</SafeText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              onClose();
              navigationRef.navigate('LogHabits', { selectedDate });
            }}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: theme.colors.iconTint.recovery,
                  borderColor: theme.colors.recovery,
                },
              ]}
            >
              <Ionicons name="journal-outline" size={20} color={theme.colors.recovery} />
            </View>
            <SafeText style={styles.actionLabel}>{t('habits.logHabits')}</SafeText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              onClose();
              navigationRef.navigate('RecordWorkout');
            }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.iconTint.strain, borderColor: theme.colors.strain },
              ]}
            >
              <Ionicons name="radio-button-on-outline" size={20} color={theme.colors.strain} />
            </View>
            <SafeText style={styles.actionLabel}>{t('activities.recordWorkout')}</SafeText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              onClose();
              navigationRef.navigate('NapSetup');
            }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.iconTint.sleep, borderColor: theme.colors.sleep },
              ]}
            >
              <Ionicons name="bed-outline" size={20} color={theme.colors.sleep} />
            </View>
            <SafeText style={styles.actionLabel}>{t('nap.startNap')}</SafeText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.scrim.medium,
    },
    sheet: {
      backgroundColor: theme.colors.surface.sheet,
      borderRadius: theme.borderRadius.xl,
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.overlay.faint,
      ...theme.shadows.lg,
    },
    handle: {
      width: theme.layout.iconSize.md,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.overlay.light,
      alignSelf: 'center',
      marginBottom: theme.spacing.sm,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: theme.spacing.md,
    },
    iconCircle: {
      width: theme.layout.iconSize.md,
      height: theme.layout.iconSize.md,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionLabel: {
      flex: 1,
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.overlay.light,
      marginLeft: 52,
    },
  });
}
