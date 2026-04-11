const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add Android 12+ Bluetooth permissions with proper flags
 */
module.exports = function withBluetoothPermissions(config) {
  return withAndroidManifest(config, config => {
    const androidManifest = config.modResults.manifest;

    // Remove any existing Bluetooth permissions to avoid duplicates
    androidManifest['uses-permission'] = (androidManifest['uses-permission'] || []).filter(perm => {
      const name = perm.$['android:name'];
      return !name.includes('BLUETOOTH') && !name.includes('LOCATION');
    });

    // Add legacy Bluetooth permissions (Android < 12)
    androidManifest['uses-permission'].push(
      {
        $: {
          'android:name': 'android.permission.BLUETOOTH',
          'android:maxSdkVersion': '30',
        },
      },
      {
        $: {
          'android:name': 'android.permission.BLUETOOTH_ADMIN',
          'android:maxSdkVersion': '30',
        },
      },
    );

    // Add Android 12+ Bluetooth permissions with neverForLocation flag
    androidManifest['uses-permission'].push(
      {
        $: {
          'android:name': 'android.permission.BLUETOOTH_SCAN',
          'android:usesPermissionFlags': 'neverForLocation',
        },
      },
      {
        $: {
          'android:name': 'android.permission.BLUETOOTH_CONNECT',
        },
      },
    );

    // Add location permissions (still needed for device discovery)
    androidManifest['uses-permission'].push(
      {
        $: {
          'android:name': 'android.permission.ACCESS_FINE_LOCATION',
        },
      },
      {
        $: {
          'android:name': 'android.permission.ACCESS_COARSE_LOCATION',
        },
      },
    );

    // Declare Bluetooth features
    androidManifest['uses-feature'] = androidManifest['uses-feature'] || [];
    androidManifest['uses-feature'].push({
      $: {
        'android:name': 'android.hardware.bluetooth_le',
        'android:required': 'true',
      },
    });

    return config;
  });
};
