import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDeviceStore } from './store/deviceStore';

import { ScanSection } from './components/ScanSection';
import { ConnectedDeviceView } from './device-details/ConnectedDeviceView';
import { useTheme, type Theme } from '../../theme';

export const DeviceManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const {
    isConnected,
    isScanning,
    isConnecting,
    scannedDevices,
    initialize,
    scan,
    connect,
    forgetDevice,
  } = useDeviceStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleSelectDevice = async (selectedDevice: { id: string; name: string | null }) => {
    await connect(selectedDevice.id, selectedDevice.name);
  };

  return (
    <View style={styles.container}>
      {isConnected ? (
        <ConnectedDeviceView onForget={() => void forgetDevice()} />
      ) : (
        <ScanSection
          scannedDevices={scannedDevices}
          isScanning={isScanning}
          isConnecting={isConnecting}
          onScan={() => void scan()}
          onSelectDevice={d => void handleSelectDevice(d)}
        />
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
      padding: theme.layout.screenPadding,
      paddingTop: theme.layout.screenPadding,
    },
  });
}
