import AsyncStorage from '@react-native-async-storage/async-storage';

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
    console.error('[DeviceCache] Failed to save device:', error);
  }
}

async function getDevice(): Promise<CachedDevice | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (!json) return null;
    return JSON.parse(json) as CachedDevice;
  } catch (error) {
    console.error('[DeviceCache] Failed to get device:', error);
    return null;
  }
}

async function clearDevice(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('[DeviceCache] Failed to clear device:', error);
  }
}

export const DeviceCache = { saveDevice, getDevice, clearDevice };
