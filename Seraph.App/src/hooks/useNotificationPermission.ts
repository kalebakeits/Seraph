import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export function useNotificationPermission() {
  useEffect(() => {
    void Notifications.getPermissionsAsync().then(({ status }) => {
      if (status !== Notifications.PermissionStatus.GRANTED) {
        void Notifications.requestPermissionsAsync();
      }
    });
  }, []);
}
