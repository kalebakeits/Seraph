import { eq, asc, gte, lte, and, or, lt, gt, ne } from 'drizzle-orm';
import { getDb } from '../db';
import { sleepEvents, notifications, type SleepEvent } from '../schema';

class SleepEventsRepository {
  async insert(event: Omit<SleepEvent, 'id' | 'created_at' | 'sleep_edited'>): Promise<number> {
    const result = await getDb().insert(sleepEvents).values({
      ...event,
      sleep_edited: 0,
      sleep_score: event.sleep_score ?? null,
      created_at: Date.now(),
    }).returning({ id: sleepEvents.id });
    return result[0].id;
  }

  async getByDate(date: string): Promise<SleepEvent[]> {
    return getDb()
      .select()
      .from(sleepEvents)
      .where(and(eq(sleepEvents.date, date), or(eq(sleepEvents.finalized, 1), eq(sleepEvents.is_manual, 1))))
      .orderBy(asc(sleepEvents.start_ts));
  }

  async getByID(id: number): Promise<SleepEvent | null> {
    const rows = await getDb()
      .select()
      .from(sleepEvents)
      .where(eq(sleepEvents.id, id))
      .limit(1);
    return rows[0] ?? null;
  }


  async getFirstForDate(date: string): Promise<SleepEvent | null> {
    const rows = await getDb()
      .select()
      .from(sleepEvents)
      .where(and(eq(sleepEvents.date, date), or(eq(sleepEvents.finalized, 1), eq(sleepEvents.is_manual, 1))))
      .orderBy(asc(sleepEvents.start_ts))
      .limit(1);
    return rows[0] ?? null;
  }

  async getByEndTsRange(fromTs: number, toTs: number): Promise<SleepEvent[]> {
    return getDb()
      .select()
      .from(sleepEvents)
      .where(and(gte(sleepEvents.end_ts, fromTs), lte(sleepEvents.end_ts, toTs)));
  }

  async getRange(from: string): Promise<SleepEvent[]> {
    return getDb()
      .select()
      .from(sleepEvents)
      .where(gte(sleepEvents.date, from))
      .orderBy(asc(sleepEvents.date));
  }

  async getActiveNap(): Promise<SleepEvent | null> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await getDb()
      .select()
      .from(sleepEvents)
      .where(
        and(
          eq(sleepEvents.date, today),
          eq(sleepEvents.finalized, 0),
          or(eq(sleepEvents.is_manual, 2), eq(sleepEvents.is_manual, 3)),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async markFinalized(id: number): Promise<void> {
    const rows = await getDb().select().from(sleepEvents).where(eq(sleepEvents.id, id)).limit(1);
    const event = rows[0];
    const durationMinutes =
      event && event.start_ts > 0 && event.end_ts > event.start_ts
        ? Math.max(0, Math.round((event.end_ts - event.start_ts) / 60000) - (event.awake_minutes ?? 0))
        : undefined;
    await getDb()
      .update(sleepEvents)
      .set({ finalized: 1, ...(durationMinutes !== undefined ? { duration_minutes: durationMinutes } : {}) })
      .where(eq(sleepEvents.id, id));
  }

  // Clear the manual edit flag so next aggregation can re-detect from raw data
  async clearEdit(id: number): Promise<void> {
    await getDb()
      .update(sleepEvents)
      .set({ sleep_edited: 0 })
      .where(eq(sleepEvents.id, id));
  }

  // User-initiated edit — sets sleep_edited = 1 to protect from re-aggregation
  async update(id: number, startTs: number, endTs: number): Promise<void> {
    const durationMinutes = Math.round((endTs - startTs) / 60000);
    await getDb()
      .update(sleepEvents)
      .set({ start_ts: startTs, end_ts: endTs, duration_minutes: durationMinutes, sleep_edited: 1 })
      .where(eq(sleepEvents.id, id));
  }

  async delete(id: number): Promise<void> {
    await getDb().delete(sleepEvents).where(eq(sleepEvents.id, id));
    await getDb()
      .delete(notifications)
      .where(and(eq(notifications.entity_type, 'sleep'), eq(notifications.entity_id, id)));
  }

  async getEarliestByEndTs(date: string, excludeId: number): Promise<SleepEvent | null> {
    const rows = await getDb()
      .select()
      .from(sleepEvents)
      .where(and(eq(sleepEvents.date, date), ne(sleepEvents.id, excludeId), or(eq(sleepEvents.finalized, 1), eq(sleepEvents.is_manual, 1))))
      .orderBy(asc(sleepEvents.end_ts))
      .limit(1);
    return rows[0] ?? null;
  }

  async hasOverlap(startTs: number, endTs: number): Promise<boolean> {
    const rows = await getDb()
      .select({ id: sleepEvents.id })
      .from(sleepEvents)
      .where(and(lt(sleepEvents.start_ts, endTs), gt(sleepEvents.end_ts, startTs)))
      .limit(1);
    return rows.length > 0;
  }

  // Aggregation-driven update — does NOT set sleep_edited, preserves existing flag
  async updateFromAggregation(
    id: number,
    startTs: number,
    endTs: number,
    avgHr?: number | null,
    hrvRmssd?: number | null,
    sleepScore?: number | null,
    hrSamples?: string | null,
  ): Promise<void> {
    const durationMinutes = Math.round((endTs - startTs) / 60000);
    await getDb()
      .update(sleepEvents)
      .set({
        start_ts: startTs,
        end_ts: endTs,
        duration_minutes: durationMinutes,
        avg_hr: avgHr ?? null,
        hrv_rmssd: hrvRmssd ?? null,
        sleep_score: sleepScore ?? null,
        hr_samples: hrSamples ?? null,
      })
      .where(eq(sleepEvents.id, id));
  }
}

export const sleepEventsRepository = new SleepEventsRepository();
