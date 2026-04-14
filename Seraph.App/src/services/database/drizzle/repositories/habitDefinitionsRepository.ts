import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { habitDefinitions, type HabitDefinition } from '../schema';

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
