import { useEffect } from 'react';
import { useDeviceStore } from '../features/device-management/store/deviceStore';

export function useDeviceInit() {
  const isConnected = useDeviceStore(state => state.isConnected);
  const setDeviceReady = useDeviceStore(state => state.setDeviceReady);

  useEffect(() => {
    setDeviceReady(isConnected);
  }, [isConnected, setDeviceReady]);
}
