import * as Sentry from '@sentry/react-native';

export function reportError(error: unknown, area: string, action: string): void {
  Sentry.captureException(error, {
    tags: { area, action },
  });
}
