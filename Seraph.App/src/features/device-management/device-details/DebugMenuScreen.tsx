import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDeviceStore } from '../store/deviceStore';
import { useDeviceClock } from '../hooks/useDeviceClock';
import { useDeviceAlarm } from '../hooks/useDeviceAlarm';
import { useCachedDevice } from '../hooks/useCachedDevice';
import { useLastTrim } from '../hooks/useLastTrim';
import { DebugMenu } from './components/DebugMenu';

export const DebugMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const { onWrist } = useDeviceStore();
  const clock = useDeviceClock();
  const alarm = useDeviceAlarm();
  const { data: cachedDevice } = useCachedDevice();
  const { data: lastTrim } = useLastTrim();

  return (
    <DebugMenu
      visible
      onClose={() => {
        navigation.goBack();
      }}
      clock={clock}
      alarm={alarm}
      onWrist={onWrist}
      lastTrim={lastTrim}
      firmwareVersion={cachedDevice?.firmwareVersion}
      hardwareVersion={cachedDevice?.hardwareVersion}
    />
  );
};
