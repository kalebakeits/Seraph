import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ScannedDevice } from '../../../services/ble/nativeModule';
import { useTheme, type Theme } from '../../../theme';

interface DeviceListProps {
  devices: ScannedDevice[];
  onSelectDevice: (device: ScannedDevice) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, onSelectDevice }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  if (devices.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{'No devices found '}</Text>
        <Text style={styles.emptyHint}>
          {'Make sure your device is nearby and in pairing mode '}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {devices.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.deviceItem}
          onPress={() => {
            onSelectDevice(item);
          }}
        >
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{`${item.name ?? 'Unknown Device'} `}</Text>
            <Text style={styles.deviceId}>{`${item.id} `}</Text>
          </View>
          <View style={styles.rssiContainer}>
            <Text style={styles.rssi}>{`${String(item.rssi)} dBm `}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      width: '100%',
    },
    deviceItem: {
      ...theme.cardStyles.default,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    deviceId: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.tertiary,
      fontFamily: 'monospace',
    },
    rssiContainer: {
      paddingLeft: theme.spacing.md,
    },
    rssi: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
    },
    emptyHint: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });
}
