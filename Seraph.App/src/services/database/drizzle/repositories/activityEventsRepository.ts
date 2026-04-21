import { eq, asc, desc, and, or, lt, gt } from 'drizzle-orm';
import { getDb, insertAndGetId } from '../db';
import { activityEvents, notifications, type ActivityEvent } from '../schema';

class ActivityEventsRepository {
  async insert(event: Omit<ActivityEvent, 'id' | 'created_at'>): Promise<number> {
    return insertAndGetId(() =>
      getDb().insert(activityEvents).values({
        ...event,
        created_at: Date.now(),
      }),
    );
  }

  async getById(id: number): Promise<ActivityEvent | null> {
    const rows = await getDb()
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async getByDate(date: string): Promise<ActivityEvent[]> {
    return getDb()
      .select()
      .from(activityEvents)
      .where(and(
        eq(activityEvents.date, date),
        or(eq(activityEvents.finalized, 1), eq(activityEvents.is_manual, 1), eq(activityEvents.is_manual, 2))
      ))
      .orderBy(asc(activityEvents.start_ts));
  }

  async deleteAutoForDate(date: string): Promise<void> {
    await getDb().delete(activityEvents).where(and(eq(activityEvents.date, date), eq(activityEvents.is_manual, 0)));
  }

  async update(id: number, startTs: number, endTs: number): Promise<void> {
    const durationMinutes = Math.round((endTs - startTs) / 60000);
    await getDb()
      .update(activityEvents)
      .set({
        start_ts: startTs,
        end_ts: endTs,
        duration_minutes: durationMinutes,
        is_manual: 1,
        finalized: 0,
        hr_sum: 0,
        hr_count: 0,
        avg_hr: 0,
        max_hr: 0,
      })
      .where(eq(activityEvents.id, id));
  }

  async deleteById(id: number): Promise<void> {
    await getDb().delete(activityEvents).where(eq(activityEvents.id, id));
    await getDb()
      .delete(notifications)
      .where(and(eq(notifications.entity_type, 'activity'), eq(notifications.entity_id, id)));
  }

  async getRecentRecordedSports(limit: number): Promise<string[]> {
    const rows = await getDb()
      .select({ type: activityEvents.type })
      .from(activityEvents)
      .where(eq(activityEvents.is_manual, 2))
      .orderBy(desc(activityEvents.created_at))
      .limit(limit);

    const seen = new Set<string>();
    const result: string[] = [];
    for (const r of rows) {
      if (r.type && r.type !== 'Workout' && !seen.has(r.type) && result.length < limit) {
        seen.add(r.type);
        result.push(r.type);
      }
    }
    return result;
  }

  async hasOverlap(startTs: number, endTs: number): Promise<boolean> {
    const rows = await getDb()
      .select({ id: activityEvents.id })
      .from(activityEvents)
      .where(and(lt(activityEvents.start_ts, endTs), gt(activityEvents.end_ts, startTs)))
      .limit(1);
    return rows.length > 0;
  }
}

export const activityEventsRepository = new ActivityEventsRepository();
