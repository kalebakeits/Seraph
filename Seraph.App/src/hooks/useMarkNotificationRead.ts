import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsRepository } from '../services/database/drizzle';

/**
 * On mount, marks the notification for the given entity as read and
 * invalidates the notifications query so the badge count updates.
 */
export function useMarkNotificationRead(entityType: 'activity' | 'sleep', entityId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      const notifications = await notificationsRepository.getRecent(50);
      const match = notifications.find(
        n => n.entity_type === entityType && n.entity_id === entityId && n.read === 0,
      );
      if (!match) return;
      await notificationsRepository.markRead(match.id);
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);
}
