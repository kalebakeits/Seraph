import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../db';
import { notifications, type Notification } from '../schema';

class NotificationsRepository {
  async getRecent(limit = 50): Promise<Notification[]> {
    return getDb()
      .select()
      .from(notifications)
      .orderBy(desc(notifications.created_at))
      .limit(limit);
  }

  async getUnreadCount(): Promise<number> {
    const rows = await getDb()
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.read, 0));
    return rows.length;
  }

  async markRead(id: number): Promise<void> {
    await getDb()
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.id, id));
  }

  async markAllRead(): Promise<void> {
    await getDb()
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.read, 0));
  }

  async deleteForEntity(entityType: string, entityId: number): Promise<void> {
    await getDb()
      .delete(notifications)
      .where(and(eq(notifications.entity_type, entityType), eq(notifications.entity_id, entityId)));
  }
}

export const notificationsRepository = new NotificationsRepository();
