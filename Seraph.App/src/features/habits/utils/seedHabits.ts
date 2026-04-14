import { habitDefinitionsRepository } from '../../../services/database/drizzle';
import { HABIT_SEED } from './habitSeed';

/**
 * Inserts seeded habit definitions on first app open.
 * Safe to call on every launch — checks count before inserting.
 */
export async function seedHabitsIfNeeded(): Promise<void> {
  const count = await habitDefinitionsRepository.count();
  if (count > 0) return;

  const now = Date.now();
  for (const entry of HABIT_SEED) {
    await habitDefinitionsRepository.insert({
      name_key: entry.name_key,
      name_custom: null,
      type: entry.type,
      unit: entry.unit,
      default_quantity: entry.default_quantity,
      is_manual: 0,
      is_active: 0,
      sort_order: entry.sort_order,
      created_at: now,
    });
  }
}
