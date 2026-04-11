import { useNotifications } from './useNotifications';

export function useUnreadCount(): number {
  const notifications = useNotifications();
  return notifications.filter(n => n.read === 0).length;
}
