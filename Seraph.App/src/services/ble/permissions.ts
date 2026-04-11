import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Check if Location Services are enabled on Android
 */
async function isLocationEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const { LocationManager } = NativeModules as {
      LocationManager?: { isLocationEnabled?: () => Promise<boolean> };
    };
    if (LocationManager?.isLocationEnabled) {
      return await LocationManager.isLocationEnabled();
    }
  } catch (error) {
    console.warn('[Permissions] Could not check location services:', error);
  }

  // If we can't check, assume it's enabled
  return true;
}

/**
 * Request Bluetooth permissions for Android/iOS
 */
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // iOS permissions are handled automatically by the system
    return true;
  }

  if (Platform.OS === 'android') {
    const apiLevel = parseInt(Platform.Version.toString(), 10);

    // Check if Location Services are enabled
    const locationEnabled = await isLocationEnabled();
    if (!locationEnabled) {
      console.error('[Permissions] Location Services disabled - BLE scan requires it');
      return false;
    }

    if (apiLevel < 31) {
      // Android 11 and below - only need location permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // Android 12+ - need BLUETOOTH_SCAN, BLUETOOTH_CONNECT, and ACCESS_FINE_LOCATION
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
      result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
      result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  return false;
}

/**
 * Request notification permissions (Android 13+ / iOS).
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if ((existing as string) === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return (status as string) === 'granted';
}
