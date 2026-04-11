import * as SQLiteExpo from 'expo-sqlite';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { nativeGetDbPath } from '../../ble/nativeModule';
import * as schema from './schema';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

let _db: AppDatabase | null = null;
let _dbPath: string | null = null;

export async function initDb(): Promise<AppDatabase> {
  if (_db) return _db;

  // Ask Native for the canonical DB path and encryption key.
  // Both sides must open the same physical file with the same key.
  const absolutePath = await nativeGetDbPath();
  const dir = absolutePath.substring(0, absolutePath.lastIndexOf('/'));
  const name = absolutePath.substring(absolutePath.lastIndexOf('/') + 1);

  const expoDb = await SQLiteExpo.openDatabaseAsync(name, {}, dir);
  await expoDb.execAsync('PRAGMA busy_timeout=5000');
  _dbPath = absolutePath;
  _db = drizzle(expoDb, { schema });

  return _db;
}

export function getDb(): AppDatabase {
  if (!_db) throw new Error('[DB] Not initialized — call initDb() first');
  return _db;
}

/** Absolute path to the SQLite file — pass this to nativeConnect() */
export function getDbPath(): string {
  if (!_dbPath) throw new Error('[DB] Not initialized — call initDb() first');
  return _dbPath;
}
