import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from '../db';
import { habitLogs, type HabitLog, type TimeOfDay } from '../schema';

interface UpsertHabitLog {
  habit_id: number;
  date: string;
  quantity: number;
  time_of_day?: TimeOfDay | null;
}

class HabitLogsRepository {
  async upsert(log: UpsertHabitLog): Promise<void> {
    await getDb()
      .insert(habitLogs)
      .values({ ...log, time_of_day: log.time_of_day ?? null, created_at: Date.now() })
      .onConflictDoUpdate({
        target: [habitLogs.habit_id, habitLogs.date],
        set: { quantity: log.quantity, time_of_day: log.time_of_day ?? null },
      });
  }

  async getForDate(date: string): Promise<HabitLog[]> {
    return getDb()
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.date, date))
      .orderBy(habitLogs.habit_id);
  }

  async getForRange(startDate: string, endDate: string): Promise<HabitLog[]> {
    return getDb()
      .select()
      .from(habitLogs)
      .where(and(gte(habitLogs.date, startDate), lte(habitLogs.date, endDate)))
      .orderBy(habitLogs.date, habitLogs.habit_id);
  }

  async getForDay(habitId: number, date: string): Promise<HabitLog | null> {
    const rows = await getDb()
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habit_id, habitId), eq(habitLogs.date, date)))
      .limit(1);
    return rows[0] ?? null;
  }

  async delete(habitId: number, date: string): Promise<void> {
    await getDb()
      .delete(habitLogs)
      .where(and(eq(habitLogs.habit_id, habitId), eq(habitLogs.date, date)));
  }
}

export const habitLogsRepository = new HabitLogsRepository();
