import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../../theme';
import { useTranslation } from 'react-i18next';

interface DeviceInfoCardProps {
  deviceName: string;
  battery?: number;
  charging?: boolean;
  onWrist?: boolean;
}

function batteryIcon(level: number): 'battery-full' | 'battery-half' | 'battery-dead' {
  if (level > 60) return 'battery-full';
  if (level > 20) return 'battery-half';
  return 'battery-dead';
}

function batteryColor(level: number, theme: Theme): string {
  if (level > 40) return theme.colors.success;
  if (level > 20) return theme.colors.warning;
  return theme.colors.error;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({
  deviceName,
  battery,
  charging,
  onWrist,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      {/* Device icon + name */}
      <View style={styles.header}>
        <View style={styles.deviceIconWrap}>
          <Ionicons name="watch" size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <SafeText style={styles.deviceName}>{deviceName}</SafeText>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <SafeText style={styles.statusLabel}>{t('device.connected')}</SafeText>
            {onWrist !== undefined && (
              <SafeText style={styles.wristBadge}>
                {onWrist ? t('device.onWrist') : t('device.offWrist')}
              </SafeText>
            )}
          </View>
        </View>
      </View>

      {/* Battery bar */}
      {battery !== undefined && (
        <View style={styles.batteryRow}>
          <Ionicons
            name={charging ? 'flash' : batteryIcon(battery)}
            size={16}
            color={charging ? theme.colors.warning : batteryColor(battery, theme)}
          />
          <View style={styles.batteryBarTrack}>
            <View
              style={[
                styles.batteryBarFill,
                {
                  width: `${String(battery)}%` as `${number}%`,
                  backgroundColor: charging ? theme.colors.warning : batteryColor(battery, theme),
                },
              ]}
            />
          </View>
          <SafeText
            style={[
              styles.batteryPct,
              { color: charging ? theme.colors.warning : batteryColor(battery, theme) },
            ]}
          >
            {battery}%
          </SafeText>
        </View>
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      ...theme.cardStyles.elevated,
      marginBottom: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    deviceIconWrap: {
      width: 56,
      height: 56,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.overlay.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    deviceName: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    statusDot: {
      width: theme.layout.legendDot,
      height: theme.layout.legendDot,
      borderRadius: 3,
    },
    statusLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    wristBadge: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      backgroundColor: theme.colors.overlay.light,
      paddingHorizontal: theme.spacing.smx,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.sm,
    },
    batteryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    batteryBarTrack: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.overlay.light,
      borderRadius: 2,
      overflow: 'hidden',
    },
    batteryBarFill: {
      height: 4,
      borderRadius: 2,
    },
    batteryPct: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      minWidth: 40,
      textAlign: 'right',
    },
  });
}
