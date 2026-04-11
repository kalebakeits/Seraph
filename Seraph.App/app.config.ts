import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Seraph',
  slug: 'Seraph',
  android: {
    ...config.android,
    minSdkVersion: 26,
  } as ExpoConfig['android'],
});
