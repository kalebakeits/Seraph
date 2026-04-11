import { eq, gte, lte, lt, and, sql, desc, isNotNull, or } from 'drizzle-orm';
import { getDb } from '../db';
import { dailyAggregations, type DailyAggregation } from '../schema';

type DailyAggregationUpdate = Partial<
  Pick<DailyAggregation, 'steps' | 'avg_hr' | 'rhr' | 'max_hr' | 'max_hr_validated' | 'hrv_rmssd' | 'strain' | 'active_minutes' | 'recovery' | 'skin_temp'>
>;

class DailyAggregationsRepository {
  async upsert(date: string, partial: DailyAggregationUpdate): Promise<void> {
    const now = Date.now();
    await getDb()
      .insert(dailyAggregations)
      .values({ date, ...partial, finalized: 0, updated_at: now })
      .onConflictDoUpdate({
        target: dailyAggregations.date,
        set: {
          steps:            sql`COALESCE(${partial.steps ?? null}, ${dailyAggregations.steps})`,
          avg_hr:           sql`COALESCE(${partial.avg_hr ?? null}, ${dailyAggregations.avg_hr})`,
          rhr:              sql`COALESCE(${partial.rhr ?? null}, ${dailyAggregations.rhr})`,
          max_hr:           sql`COALESCE(${partial.max_hr ?? null}, ${dailyAggregations.max_hr})`,
          max_hr_validated: sql`COALESCE(${partial.max_hr_validated ?? null}, ${dailyAggregations.max_hr_validated})`,
          hrv_rmssd:        sql`COALESCE(${partial.hrv_rmssd ?? null}, ${dailyAggregations.hrv_rmssd})`,
          strain:           sql`COALESCE(${partial.strain ?? null}, ${dailyAggregations.strain})`,
          active_minutes:   sql`COALESCE(${partial.active_minutes ?? null}, ${dailyAggregations.active_minutes})`,
          recovery:         sql`COALESCE(${partial.recovery ?? null}, ${dailyAggregations.recovery})`,
          skin_temp:        sql`COALESCE(${partial.skin_temp ?? null}, ${dailyAggregations.skin_temp})`,
          updated_at:       now,
        },
      });
  }

  async clearRecovery(date: string): Promise<void> {
    await getDb()
      .update(dailyAggregations)
      .set({ rhr: null, hrv_rmssd: null, recovery: null, updated_at: Date.now() })
      .where(eq(dailyAggregations.date, date));
  }

  async getByDate(date: string): Promise<DailyAggregation | null> {
    const rows = await getDb()
      .select()
      .from(dailyAggregations)
      .where(eq(dailyAggregations.date, date));
    return rows[0] ?? null;
  }

  async getRange(from: string, to: string): Promise<DailyAggregation[]> {
    return getDb()
      .select()
      .from(dailyAggregations)
      .where(and(gte(dailyAggregations.date, from), lte(dailyAggregations.date, to)))
      .orderBy(dailyAggregations.date);
  }

  async getLastFinalized(before: string): Promise<DailyAggregation | null> {
    const rows = await getDb()
      .select()
      .from(dailyAggregations)
      .where(and(lte(dailyAggregations.date, before), eq(dailyAggregations.finalized, 1)))
      .orderBy(desc(dailyAggregations.date))
      .limit(1);
    return rows[0] ?? null;
  }

  async getLastAggTs(date: string): Promise<number | null> {
    const rows = await getDb()
      .select({ last_agg_ts: dailyAggregations.last_agg_ts })
      .from(dailyAggregations)
      .where(eq(dailyAggregations.date, date));
    return rows[0]?.last_agg_ts ?? null;
  }

  async markFinalized(date: string): Promise<void> {
    await getDb()
      .update(dailyAggregations)
      .set({ finalized: 1, updated_at: Date.now() })
      .where(eq(dailyAggregations.date, date));
  }

  async getLatestSleepNeed(since: number): Promise<number | null> {
    const rows = await getDb()
      .select({ sleep_need: dailyAggregations.sleep_need })
      .from(dailyAggregations)
      .where(and(isNotNull(dailyAggregations.sleep_need), gte(dailyAggregations.updated_at, since)))
      .orderBy(desc(dailyAggregations.updated_at))
      .limit(1);
    return rows[0]?.sleep_need ?? null;
  }

  async getLatestWithLoad(onOrBefore: string): Promise<DailyAggregation | null> {
    const rows = await getDb()
      .select()
      .from(dailyAggregations)
      .where(and(isNotNull(dailyAggregations.ctl), lte(dailyAggregations.date, onOrBefore)))
      .orderBy(desc(dailyAggregations.date))
      .limit(1);
    return rows[0] ?? null;
  }

  async getLatestWithLoadBefore(date: string): Promise<DailyAggregation | null> {
    const rows = await getDb()
      .select()
      .from(dailyAggregations)
      .where(and(isNotNull(dailyAggregations.ctl), lt(dailyAggregations.date, date)))
      .orderBy(desc(dailyAggregations.date))
      .limit(1);
    return rows[0] ?? null;
  }

  async getLatestWithBaselines(): Promise<{ baseline_hrv: number | null; baseline_rhr: number | null; date: string } | null> {
    const rows = await getDb()
      .select({ date: dailyAggregations.date, baseline_hrv: dailyAggregations.baseline_hrv, baseline_rhr: dailyAggregations.baseline_rhr })
      .from(dailyAggregations)
      .where(or(isNotNull(dailyAggregations.baseline_hrv), isNotNull(dailyAggregations.baseline_rhr)))
      .orderBy(desc(dailyAggregations.date))
      .limit(1);
    return rows[0] ?? null;
  }

  async getMaxLastAggTs(): Promise<number | null> {
    const rows = await getDb()
      .select({ max_ts: sql<number>`MAX(${dailyAggregations.last_agg_ts})` })
      .from(dailyAggregations);
    return rows[0]?.max_ts ?? null;
  }
}

export const dailyAggregationsRepository = new DailyAggregationsRepository();
