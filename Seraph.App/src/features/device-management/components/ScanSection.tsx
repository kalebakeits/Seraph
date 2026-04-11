import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ScannedDevice } from '../../../services/ble/nativeModule';
import type { CachedDevice } from '../../../services/ble/DeviceCache';
import { DeviceList } from './DeviceList';
import { LiquidGlassButton } from '../../../components/common/LiquidGlassButton';
import { theme } from '../../../theme';

interface ScanSectionProps {
  cachedDevice: CachedDevice | null | undefined;
  scannedDevices: ScannedDevice[];
  isScanning: boolean;
  isConnecting: boolean;
  onScan: () => void;
  onConnectCached: () => void;
  onSelectDevice: (device: { id: string; name: string | null }) => void;
}

export const ScanSection: React.FC<ScanSectionProps> = ({
  cachedDevice,
  scannedDevices,
  isScanning,
  isConnecting,
  onScan,
  onConnectCached,
  onSelectDevice,
}) => {
  const isDisabled = isScanning || isConnecting;
  let scanButtonTitle = 'Scan for Devices ';
  if (isScanning) scanButtonTitle = 'Scanning... ';
  else if (isConnecting) scanButtonTitle = 'Connecting... ';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{'Device Connection '}</Text>

      {cachedDevice && (
        <TouchableOpacity
          style={[styles.cachedButton, isConnecting && styles.scanButtonDisabled]}
          onPress={onConnectCached}
          disabled={isConnecting}
        >
          <Text style={styles.cachedButtonTitle}>{`${cachedDevice.name} `}</Text>
          <Text style={styles.cachedButtonSubtitle}>{'Last connected • Tap to reconnect '}</Text>
        </TouchableOpacity>
      )}

      <LiquidGlassButton
        onPress={onScan}
        title={scanButtonTitle}
        disabled={isDisabled}
        loading={isScanning || isConnecting}
        style={styles.scanButton}
      />

      {scannedDevices.length > 0 && (
        <View style={styles.devicesContainer}>
          <Text
            style={styles.devicesTitle}
          >{`Found ${String(scannedDevices.length)} device(s) `}</Text>
          <DeviceList devices={scannedDevices} onSelectDevice={onSelectDevice} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cachedButton: {
    ...theme.liquidGlassButton.base,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cachedButtonTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  cachedButtonSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  scanButton: {
    marginBottom: theme.spacing.md,
  },
  scanButtonDisabled: {
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
