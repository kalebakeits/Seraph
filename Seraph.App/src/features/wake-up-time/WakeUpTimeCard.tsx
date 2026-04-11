import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { theme } from '../../theme';
import { formatTime, formatDuration } from '../../utils/dateUtils';
import { useNextAlarm } from './hooks/useNextAlarm';
import { useAlarmPreferences } from './hooks/useAlarmPreferences';
import { useSleepNeedFactors } from './hooks/useSleepNeedFactors';
import { SleepNeedFactors } from './components/SleepNeedFactors';
import { SafeText } from '../../components/common/SafeText';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'WakeUp'>;

export const WakeUpTimeCard: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { data: sleepNeedData } = useSleepNeedFactors();
  const { data: nextAlarmData } = useNextAlarm();
  const { alarmMode } = useAlarmPreferences();

  const sleepNeedMinutes = sleepNeedData?.totalMinutes ?? 480;
  const nextAlarmSeconds = nextAlarmData?.nextAlarmSeconds ?? null;
  const isDisabled = alarmMode === 'disabled' || nextAlarmSeconds === null;

  const wakeTime = isDisabled ? null : new Date(nextAlarmSeconds * 1000);
  const bedTime = wakeTime ? new Date(wakeTime.getTime() - sleepNeedMinutes * 60_000) : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('WakeUp');
      }}
    >
      {isDisabled ? (
        <View style={styles.noAlarmRow}>
          <Ionicons name="alarm-outline" size={18} color={theme.colors.text.muted} />
          <SafeText style={styles.noAlarmText}>{t('alarm.noAlarm')}</SafeText>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.text.muted} />
        </View>
      ) : (
        <View style={styles.timeline}>
          <View style={styles.timeBlock}>
            <View style={styles.moonCircle}>
              <Ionicons name="moon" size={16} color={theme.colors.sleep} />
            </View>
            <SafeText style={styles.timeValue}>
              {bedTime ? formatTime(bedTime.getTime()) : '--'}
            </SafeText>
          </View>

          <View style={styles.durationPill}>
            <View style={styles.durationLine} />
            <View style={styles.pill}>
              <SafeText style={styles.pillText}>
                {formatDuration(sleepNeedMinutes * 60_000)}
              </SafeText>
            </View>
            <View style={styles.durationLine} />
          </View>

          <View style={styles.timeBlock}>
            <View style={styles.sunCircle}>
              <Ionicons name="sunny" size={16} color={theme.colors.warning} />
            </View>
            <SafeText style={styles.timeValue}>
              {wakeTime ? formatTime(wakeTime.getTime()) : '--'}
            </SafeText>
          </View>
        </View>
      )}

      <View style={styles.divider} />
      {sleepNeedData && <SleepNeedFactors {...sleepNeedData} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...theme.cardStyles.default,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  noAlarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  noAlarmText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  moonCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(81,181,239,0.6)',
    backgroundColor: 'rgba(81,181,239,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.6)',
    backgroundColor: 'rgba(243,156,18,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  durationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  durationLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pill: {
    backgroundColor: 'rgba(81,181,239,0.2)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  pillText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.sleep,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
