export { initDb, getDb, runInTransaction } from './nativeDriver';
export type { AppDatabase } from './nativeDriver';

import { sql } from 'drizzle-orm';
import { getDb } from './nativeDriver';

export async function insertAndGetId(insertFn: () => Promise<unknown>): Promise<number> {
  await insertFn();
  const result = await getDb().get<{ id: number }>(sql`SELECT last_insert_rowid() AS id`);
  return result.id;
}
