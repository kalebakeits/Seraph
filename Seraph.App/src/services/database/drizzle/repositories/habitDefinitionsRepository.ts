import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../db';
import { habitDefinitions, habitLogs, type HabitDefinition } from '../schema';

class HabitDefinitionsRepository {
  async getAll(): Promise<HabitDefinition[]> {
    return getDb()
      .select()
      .from(habitDefinitions)
      .orderBy(habitDefinitions.sort_order, habitDefinitions.id);
  }

  async getActive(): Promise<HabitDefinition[]> {
    return getDb()
      .select()
      .from(habitDefinitions)
      .where(eq(habitDefinitions.is_active, 1))
      .orderBy(habitDefinitions.sort_order, habitDefinitions.id);
  }

  /** Active habits + any habit that has a log on the given date (so deselected habits still appear if already logged). */
  async getActiveForDate(date: string): Promise<HabitDefinition[]> {
    const [active, logsOnDate] = await Promise.all([
      this.getActive(),
      getDb().select({ habit_id: habitLogs.habit_id }).from(habitLogs).where(eq(habitLogs.date, date)),
    ]);
    const loggedIds = logsOnDate.map(r => r.habit_id);
    const extraIds = loggedIds.filter(id => !active.some(h => h.id === id));
    let extras: HabitDefinition[] = [];
    if (extraIds.length > 0) {
      extras = await getDb()
        .select()
        .from(habitDefinitions)
        .where(inArray(habitDefinitions.id, extraIds));
    }
    return [...active, ...extras].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }

  async setActive(id: number, active: boolean): Promise<void> {
    await getDb()
      .update(habitDefinitions)
      .set({ is_active: active ? 1 : 0 })
      .where(eq(habitDefinitions.id, id));
  }

  async insert(habit: Omit<HabitDefinition, 'id'>): Promise<number> {
    const result = await getDb()
      .insert(habitDefinitions)
      .values(habit)
      .returning({ id: habitDefinitions.id });
    return result[0].id;
  }

  async deleteCustom(id: number): Promise<void> {
    await getDb()
      .delete(habitDefinitions)
      .where(eq(habitDefinitions.id, id));
  }

  async count(): Promise<number> {
    const rows = await getDb().select({ id: habitDefinitions.id }).from(habitDefinitions);
    return rows.length;
  }
}

export const habitDefinitionsRepository = new HabitDefinitionsRepository();
