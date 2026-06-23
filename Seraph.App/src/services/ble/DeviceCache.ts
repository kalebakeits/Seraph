import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportError } from '../../utils/reportError';

const CACHE_KEY = '@seraph/cached_device';

export interface CachedDevice {
  id: string;
  name: string;
  lastConnected: number;
  firmwareVersion?: string;
  hardwareVersion?: string;
}

async function saveDevice(device: CachedDevice): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(device));
  } catch (error) {
    reportError(error, 'device', 'saveDeviceCache');
  }
}

async function getDevice(): Promise<CachedDevice | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (!json) return null;
    return JSON.parse(json) as CachedDevice;
  } catch (error) {
    reportError(error, 'device', 'getDeviceCache');
    return null;
  }
}

async function clearDevice(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    reportError(error, 'device', 'clearDeviceCache');
  }
}

export const DeviceCache = { saveDevice, getDevice, clearDevice };
