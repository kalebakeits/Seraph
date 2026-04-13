import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeText } from '../../../../components/common/SafeText';
import { LogActivitySheet } from './LogActivitySheet';
import { NapSetupSheet } from '../../../nap/NapSetupSheet';
import { theme } from '../../../../theme';
import { ActivityType } from '../../../../types/ActivityType';
import type { HomeStackParamList } from '../../../../navigation/HomeStackNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface ActivityActionSheetProps {
  selectedDate: string;
  isToday: boolean;
  onClose: () => void;
}

type SubSheet = 'sleep' | 'workout' | 'nap' | null;

export const ActivityActionSheet: React.FC<ActivityActionSheetProps> = ({
  selectedDate,
  isToday,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
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

  if (subSheet === 'nap') {
    return <NapSetupSheet onClose={onClose} />;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <Pressable
            style={styles.sheet}
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

            {isToday && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSubSheet('nap');
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(81,181,239,0.12)' }]}>
                    <Ionicons name="bed-outline" size={20} color={theme.colors.sleep} />
                  </View>
                  <SafeText style={styles.actionLabel}>{t('nap.startNap')}</SafeText>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
                </TouchableOpacity>
              </>
            )}

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

            {isToday && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[styles.actionBtn, styles.recordBtn]}
                  activeOpacity={0.75}
                  onPress={() => {
                    onClose();
                    navigation.navigate('RecordWorkout');
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,87,108,0.22)' }]}>
                    <Ionicons name="radio-button-on" size={20} color={theme.colors.strain} />
                  </View>
                  <SafeText style={[styles.actionLabel, { color: theme.colors.strain }]}>
                    {t('activities.recordWorkout')}
                  </SafeText>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.strain} />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
              <SafeText style={styles.cancelText}>{t('common.cancel')}</SafeText>
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface.sheet,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.overlay.light,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  recordBtn: {
    // slight highlight
  },
  iconCircle: {
    width: 40,
    height: 40,
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
    marginLeft: 56, // align with text, past icon
  },
  cancelBtn: {
    marginTop: theme.spacing.md,
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
});
