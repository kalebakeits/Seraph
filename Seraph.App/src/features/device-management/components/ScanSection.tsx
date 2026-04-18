import React, { useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import type { ScannedDevice } from '../../../services/ble/nativeModule';
import { DeviceList } from './DeviceList';
import { useTheme, type Theme } from '../../../theme';

interface ScanSectionProps {
  scannedDevices: ScannedDevice[];
  isScanning: boolean;
  isConnecting: boolean;
  onScan: () => void;
  onSelectDevice: (device: { id: string; name: string | null }) => void;
  showTitle?: boolean;
}

export const ScanSection: React.FC<ScanSectionProps> = ({
  scannedDevices,
  isScanning,
  isConnecting,
  onScan,
  onSelectDevice,
  showTitle = true,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const isDisabled = isScanning || isConnecting;

  return (
    <View style={styles.section}>
      {showTitle && <SafeText style={styles.sectionTitle}>{t('device.connection.title')}</SafeText>}

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: theme.colors.bluetooth }, isDisabled && styles.disabled]}
        onPress={onScan}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {isScanning || isConnecting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <SafeText style={styles.scanButtonText}>{t('device.connection.scan')}</SafeText>
        )}
      </TouchableOpacity>

      {scannedDevices.length > 0 && (
        <View style={styles.devicesContainer}>
          <SafeText style={styles.devicesTitle}>
            {t('device.connection.found', { count: scannedDevices.length })}
          </SafeText>
          <DeviceList devices={scannedDevices} onSelectDevice={onSelectDevice} />
        </View>
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    scanButton: {
      borderRadius: theme.borderRadius.full,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    scanButtonText: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: '#ffffff',
    },
    disabled: {
      opacity: 0.5,
    },
    devicesContainer: {
      marginTop: theme.spacing.md,
    },
    devicesTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
    },
  });
}
