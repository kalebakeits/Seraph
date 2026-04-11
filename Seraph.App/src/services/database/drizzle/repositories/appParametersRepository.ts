import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { appParameters } from '../schema';

export type AppParameter =
  // Sync state
  | 'lastTrim'
  | 'lastHistoricalSync'
  // Alarm preferences
  | 'alarm_time'
  | 'alarm_mode'
  | 'alarm_schedule'
  // User profile (manual)
  | 'profile_name'
  | 'profile_dob'               // ISO date string e.g. "1995-06-14"
  | 'profile_age'               // integer string — derived from DOB on save
  | 'profile_sex'               // "male" | "female"
  | 'profile_height_cm'
  | 'profile_weight_kg'
  | 'profile_sleep_goal_minutes'
  | 'profile_fitness_level'     // "sedentary" | "moderate" | "active" | "athlete"
  | 'profile_threshold_hr'      // FTHR — functional threshold heart rate
  // Activity detection thresholds
  | 'activity_min_trimp'        // minimum TRIMP to finalize an auto-detected activity
  | 'activity_min_ms'           // minimum duration in ms (hard floor: 900000 = 15min)
  // Storage settings
  | 'r24_granularity_seconds'  // how many seconds between stored R24 rows (1, 2, 5, or 10)
  // Computed baselines (written by Native)
  | 'baseline_max_hr'
  | 'onboarding_complete'
  | 'language';

class AppParametersRepository {
  async get(key: AppParameter): Promise<string | null> {
    const rows = await getDb()
      .select({ value: appParameters.value })
      .from(appParameters)
      .where(eq(appParameters.key, key));
    return rows[0]?.value ?? null;
  }

  async getNumeric(key: AppParameter): Promise<number | null> {
    const value = await this.get(key);
    return value === null ? null : parseInt(value, 10);
  }

  async getRow(key: AppParameter): Promise<{ key: string; value: string; updated_at: number } | null> {
    const rows = await getDb()
      .select()
      .from(appParameters)
      .where(eq(appParameters.key, key));
    return rows[0] ?? null;
  }

  async set(key: AppParameter, value: string | number): Promise<void> {
    await getDb()
      .insert(appParameters)
      .values({ key, value: String(value), updated_at: Date.now() })
      .onConflictDoUpdate({
        target: appParameters.key,
        set: { value: String(value), updated_at: Date.now() },
      });
  }

  async delete(key: AppParameter): Promise<void> {
    await getDb().delete(appParameters).where(eq(appParameters.key, key));
  }
}

export const appParametersRepository = new AppParametersRepository();
