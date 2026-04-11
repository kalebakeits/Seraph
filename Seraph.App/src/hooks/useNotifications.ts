import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { seraphEmitter } from '../services/ble/nativeModule';
import { notificationsRepository } from '../services/database/drizzle';
import type { Notification } from '../services/database/drizzle';

const QUERY_KEY = ['notifications'] as const;

export function useNotifications(): Notification[] {
  const queryClient = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsRepository.getRecent(50),
  });

  useEffect(() => {
    const sub = seraphEmitter.addListener('onInAppNotification', () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    });
    return () => {
      sub.remove();
    };
  }, [queryClient]);

  return data;
}
