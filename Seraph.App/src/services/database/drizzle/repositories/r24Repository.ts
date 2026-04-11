import { eq, gte, lte, and, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { r24, type R24Record } from '../schema';

export interface MinuteHRRecord { minuteStart: number; avgHr: number }

class R24Repository {
  async insertBatch(records: Omit<R24Record, 'id'>[]): Promise<void> {
    if (records.length === 0) return;
    const db = getDb();
    // Insert in chunks to avoid hitting SQLite bind parameter limits
    const CHUNK = 100;
    for (let i = 0; i < records.length; i += CHUNK) {
      await db
        .insert(r24)
        .values(records.slice(i, i + CHUNK))
        .onConflictDoNothing();
    }
  }

  async getRecordsSince(timestamp: number, deviceId: string): Promise<MinuteHRRecord[]> {
    const db = getDb();
    return db
      .select({
        minuteStart: sql<number>`(${r24.timestamp} / 600000) * 600000`,
        avgHr: sql<number>`AVG(${r24.heart_rate})`,
      })
      .from(r24)
      .where(and(eq(r24.device_id, deviceId), gte(r24.timestamp, timestamp)))
      .groupBy(sql`(${r24.timestamp} / 600000)`)
      .orderBy(sql`(${r24.timestamp} / 600000) * 600000`);
  }

  async getHRForDate(date: string): Promise<{ heart_rate: number }[]> {
    const db = getDb();
    const start = new Date(date + 'T00:00:00.000Z').getTime();
    const end = start + 86400000 - 1;
    return db
      .select({ heart_rate: r24.heart_rate })
      .from(r24)
      .where(and(gte(r24.timestamp, start), lte(r24.timestamp, end)));
  }

  async getRange(startTs: number, endTs: number): Promise<R24Record[]> {
    return getDb()
      .select()
      .from(r24)
      .where(and(gte(r24.timestamp, startTs), lte(r24.timestamp, endTs)))
      .orderBy(r24.timestamp);
  }

  async getBoundsForDate(date: string): Promise<{ minTs: number; maxTs: number } | null> {
    const start = new Date(date + 'T00:00:00.000Z').getTime();
    const end = new Date(date + 'T23:59:59.999Z').getTime();
    const rows = await getDb()
      .select({ ts: r24.timestamp })
      .from(r24)
      .where(and(gte(r24.timestamp, start), lte(r24.timestamp, end)))
      .orderBy(r24.timestamp);
    if (rows.length === 0) return null;
    return { minTs: rows[0].ts, maxTs: rows[rows.length - 1].ts };
  }

  async purgeOlderThan(timestamp: number): Promise<void> {
    await getDb().delete(r24).where(lte(r24.timestamp, timestamp));
  }

  async getLatestSequence(deviceId: string): Promise<number | null> {
    const db = getDb();
    const rows = await db
      .select({ seq: sql<number>`MAX(${r24.sequence})` })
      .from(r24)
      .where(eq(r24.device_id, deviceId));
    return rows[0]?.seq ?? null;
  }

}

export const r24Repository = new R24Repository();
