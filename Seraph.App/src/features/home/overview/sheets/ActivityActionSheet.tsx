import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeText } from '../../../../components/common/SafeText';
import { LogActivitySheet } from './LogActivitySheet';
import { theme } from '../../../../theme';
import { ActivityType } from '../../../../types/ActivityType';
import type { HomeStackParamList } from '../../../../navigation/HomeStackNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface ActivityActionSheetProps {
  selectedDate: string;
  onClose: () => void;
}

type SubSheet = 'sleep' | 'workout' | null;

export const ActivityActionSheet: React.FC<ActivityActionSheetProps> = ({
  selectedDate,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
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
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(81,181,239,0.18)' }]}>
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
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(244,191,239,0.18)' }]}>
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
              navigation.navigate('LogHabits', { selectedDate });
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(180,140,255,0.18)' }]}>
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
              navigation.navigate('RecordWorkout');
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,87,108,0.22)' }]}>
              <Ionicons name="radio-button-on" size={20} color={theme.colors.strain} />
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
              navigation.navigate('NapSetup');
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(81,181,239,0.12)' }]}>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.surface.sheet,
    borderRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    width: 36,
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
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
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
