import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDeviceStore } from './store/deviceStore';
import { useCachedDevice } from './hooks/useCachedDevice';

import { ScanSection } from './components/ScanSection';
import { ConnectedDeviceView } from './device-details/ConnectedDeviceView';
import { theme } from '../../theme';

export const DeviceManagementScreen: React.FC = () => {
  const {
    isConnected,
    isScanning,
    isConnecting,
    scannedDevices,
    initialize,
    scan,
    connect,
    connectCached,
    forgetDevice,
  } = useDeviceStore();

  const { data: cachedDevice } = useCachedDevice();

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
          cachedDevice={cachedDevice}
          scannedDevices={scannedDevices}
          isScanning={isScanning}
          isConnecting={isConnecting}
          onScan={() => void scan()}
          onConnectCached={() => void connectCached()}
          onSelectDevice={d => void handleSelectDevice(d)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: theme.layout.screenPadding,
    paddingTop: 80,
  },
});
