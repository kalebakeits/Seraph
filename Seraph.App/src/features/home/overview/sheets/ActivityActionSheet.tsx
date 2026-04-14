import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, TouchableOpacity, Pressable, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeText } from '../../../../components/common/SafeText';
import { LogActivitySheet } from './LogActivitySheet';
import { NapSetupSheet } from '../../../nap/NapSetupSheet';
import { LogHabitsSheet } from '../../../habits/LogHabitsSheet';
import { theme } from '../../../../theme';
import { ActivityType } from '../../../../types/ActivityType';
import type { HomeStackParamList } from '../../../../navigation/HomeStackNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface ActivityActionSheetProps {
  selectedDate: string;
  isToday: boolean;
  onClose: () => void;
}

type SubSheet = 'sleep' | 'workout' | 'nap' | 'habits' | null;

export const ActivityActionSheet: React.FC<ActivityActionSheetProps> = ({
  selectedDate,
  isToday,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [subSheet, setSubSheet] = useState<SubSheet>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isToday) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => {
      anim.stop();
    };
  }, [isToday, pulse]);


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

  if (subSheet === 'habits') {
    return <LogHabitsSheet selectedDate={selectedDate} onClose={onClose} />;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
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
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
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
                    <SafeText style={[styles.actionLabel, { color: theme.colors.strain }]}>
                      {t('activities.recordWorkout')}
                    </SafeText>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.strain} />
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={() => {
                setSubSheet('habits');
              }}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(180,140,255,0.18)' }]}>
                <Ionicons name="journal-outline" size={20} color={theme.colors.recovery} />
              </View>
              <SafeText style={styles.actionLabel}>{t('habits.logHabits')}</SafeText>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
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
    paddingHorizontal: 16,
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
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
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
    marginLeft: 56,
  },
});
