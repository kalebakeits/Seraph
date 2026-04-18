import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { DeviceStatusIndicator } from '../../device-management/components/DeviceStatusIndicator';
import type { DeviceState } from '../../device-management/types/DeviceState';
import { useTheme, type Theme } from '../../../theme';
import { formatShortDate } from '../../../utils/dateUtils';

interface Props {
  deviceState: DeviceState;
  battery: number | undefined;
  lastSynced: string | null;
  unreadCount: number;
  selectedDate: string;
  today: string;
  onDevicePress: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onDatePress: () => void;
  onBellPress: () => void;
}

export const HomeHeader: React.FC<Props> = ({
  deviceState,
  battery,
  lastSynced,
  unreadCount,
  selectedDate,
  today,
  onDevicePress,
  onPrevDay,
  onNextDay,
  onDatePress,
  onBellPress,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.deviceStatus} onPress={onDevicePress} activeOpacity={0.7}>
        <View style={styles.deviceStatusInner}>
          <View style={styles.deviceStatusRow}>
            <DeviceStatusIndicator state={deviceState} />
            {battery !== undefined && (
              <SafeText style={styles.batteryText}>
                {t('device.battery', { value: battery })}
              </SafeText>
            )}
          </View>
          {lastSynced && <SafeText style={styles.lastSyncedText}>{lastSynced}</SafeText>}
        </View>
      </TouchableOpacity>

      <View style={styles.dateNav}>
        <TouchableOpacity onPress={onPrevDay} style={styles.navArrow} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={16} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.navDivider} />
        <TouchableOpacity onPress={onDatePress} activeOpacity={0.7}>
          <SafeText style={styles.dateText}>{formatShortDate(selectedDate)}</SafeText>
        </TouchableOpacity>
        <View style={styles.navDivider} />
        <TouchableOpacity
          onPress={onNextDay}
          style={[styles.navArrow, selectedDate >= today && styles.navArrowDisabled]}
          activeOpacity={selectedDate < today ? 0.7 : 1}
          disabled={selectedDate >= today}
        >
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.bellButton, styles.badgeContainer]}
        activeOpacity={0.7}
        onPress={onBellPress}
      >
        <Ionicons name="notifications-outline" size={20} color={theme.colors.text.primary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <SafeText style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : String(unreadCount)}
            </SafeText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    deviceStatus: {
      alignItems: 'flex-start',
    },
    deviceStatusInner: {
      alignItems: 'flex-start',
    },
    deviceStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.smx,
    },
    batteryText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    lastSyncedText: {
      fontSize: 10,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.xxs,
    },
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.overlay.medium,
      borderRadius: theme.borderRadius.full,
      paddingVertical: theme.spacing.smx,
      paddingHorizontal: theme.spacing.xs,
      gap: 0,
    },
    navArrow: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navDivider: {
      width: 1,
      height: 16,
      backgroundColor: theme.colors.overlay.light,
    },
    navArrowDisabled: {
      opacity: 0.35,
    },
    dateText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
      minWidth: 110,
      textAlign: 'center',
    },
    bellButton: {
      width: theme.layout.iconSize.md,
      height: theme.layout.iconSize.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.overlay.medium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeContainer: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      color: theme.colors.text.primary,
      fontSize: 10,
      fontWeight: theme.typography.weights.bold,
    },
  });
}
