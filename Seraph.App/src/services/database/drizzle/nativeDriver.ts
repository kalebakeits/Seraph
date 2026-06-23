import { NativeModules } from 'react-native';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

const DbModule = NativeModules.DbModule as {
  dbQuery(sql: string, params: unknown[]): Promise<unknown[][]>;
  dbExec(sql: string, params: unknown[]): Promise<number>;
  dbBeginTx(): Promise<string>;
  dbExecInTx(txId: string, sql: string, params: unknown[]): Promise<number>;
  dbQueryInTx(txId: string, sql: string, params: unknown[]): Promise<unknown[][]>;
  dbCommit(txId: string): Promise<void>;
  dbRollback(txId: string): Promise<void>;
  getDbReady(): Promise<void>;
};

export type AppDatabase = SqliteRemoteDatabase<typeof schema>;

let _db: AppDatabase | null = null;

export async function initDb(): Promise<AppDatabase> {
  if (_db) return _db;
  await DbModule.getDbReady();
  _db = drizzle(
    async (sql, params, method) => {
      const args = params as unknown[];
      if (method === 'run') {
        await DbModule.dbExec(sql, args);
        return { rows: [] };
      }
      const rows = await DbModule.dbQuery(sql, args);
      if (method === 'get') {
        // Drizzle expects rows to be the first row array directly
        return { rows: rows[0] ?? [] };
      }
      // 'all' and 'values': rows is array of arrays
      return { rows };
    },
    { schema },
  );
  return _db;
}

export function getDb(): AppDatabase {
  if (!_db) throw new Error('[DB] Not initialized — call initDb() first');
  return _db;
}

export async function runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const txId = await DbModule.dbBeginTx();
  try {
    const result = await fn();
    await DbModule.dbCommit(txId);
    return result;
  } catch (e) {
    await DbModule.dbRollback(txId).catch((_e: unknown) => undefined);
    throw e;
  }
}
