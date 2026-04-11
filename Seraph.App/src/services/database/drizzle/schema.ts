import { sqliteTable, integer, real, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// ─── r24 ────────────────────────────────────────────────────────────────────

export const r24 = sqliteTable('r24', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  sequence:     integer('sequence').notNull(),
  timestamp:    integer('timestamp').notNull(),
  subseconds:   integer('subseconds').notNull(),
  heart_rate:   integer('heart_rate').notNull(),
  rr_intervals: text('rr_intervals'),
  skin_temp:    real('skin_temp').notNull(),
  step_count:   integer('step_count').notNull(),
  b2:           integer('b2').notNull(),
  b80:          integer('b80').notNull().default(0),
  device_id:    text('device_id').notNull(),
  created_at:   integer('created_at').notNull(),
}, (t) => [
  uniqueIndex('r24_device_seq_idx').on(t.device_id, t.sequence),
  index('r24_device_ts_idx').on(t.device_id, t.timestamp),
]);

// ─── app_parameters ─────────────────────────────────────────────────────────

export const appParameters = sqliteTable('app_parameters', {
  key:        text('key').primaryKey(),
  value:      text('value').notNull(),
  updated_at: integer('updated_at').notNull(),
});

// ─── daily_aggregations ─────────────────────────────────────────────────────

export const dailyAggregations = sqliteTable('daily_aggregations', {
  date:              text('date').primaryKey(),
  steps:             integer('steps'),
  avg_hr:            real('avg_hr'),
  rhr:               real('rhr'),
  max_hr:            real('max_hr'),
  max_hr_validated:  integer('max_hr_validated'),
  hrv_rmssd:         real('hrv_rmssd'),
  strain:            real('strain'),
  active_minutes:    integer('active_minutes'),
  recovery:          real('recovery'),
  skin_temp:         real('skin_temp'),
  sleep_need:        real('sleep_need'),
  sleep_debt_adj:    real('sleep_debt_adj'),
  sleep_strain_adj:  real('sleep_strain_adj'),
  trimp:               real('trimp'),
  ctl:                 real('ctl'),
  atl:                 real('atl'),
  hrv_windows:         text('hrv_windows'),
  daily_stress:        integer('daily_stress'),
  baseline_waking_hrv: real('baseline_waking_hrv'),
  baseline_hrv:        real('baseline_hrv'),
  baseline_rhr:        real('baseline_rhr'),
  finalized:           integer('finalized').notNull().default(0),
  last_agg_ts:       integer('last_agg_ts'),
  updated_at:        integer('updated_at').notNull(),
});

// ─── sleep_events ────────────────────────────────────────────────────────────

export const sleepEvents = sqliteTable('sleep_events', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  date:             text('date').notNull(),
  start_ts:         integer('start_ts').notNull(),
  end_ts:           integer('end_ts').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  awake_minutes:    integer('awake_minutes').notNull().default(0),
  pending_awake_ms: integer('pending_awake_ms').notNull().default(0),
  avg_hr:           real('avg_hr'),
  hrv_rmssd:        real('hrv_rmssd'),
  hr_samples:       text('hr_samples'), // JSON: [{t:number,hr:number}]
  stage_samples:    text('stage_samples'), // JSON: [{s:number,from:number,to:number}] run-length encoded b80 states
  finalized:        integer('finalized').notNull().default(0),
  sleep_edited:     integer('sleep_edited').notNull().default(0),
  is_manual:        integer('is_manual').notNull().default(0),
  sleep_score:      integer('sleep_score'),
  timezone:         text('timezone'), // IANA tz at time of recording, e.g. 'Europe/London'
  created_at:       integer('created_at').notNull(),
}, (t) => [
  index('sleep_events_date_idx').on(t.date),
]);

// ─── activity_events ─────────────────────────────────────────────────────────

export const activityEvents = sqliteTable('activity_events', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  date:             text('date').notNull(),
  start_ts:         integer('start_ts').notNull(),
  end_ts:           integer('end_ts').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  avg_hr:           real('avg_hr'),
  max_hr:           real('max_hr'),
  hr_sum:           real('hr_sum').notNull().default(0),
  hr_count:         integer('hr_count').notNull().default(0),
  steps:            integer('steps'),
  type:             text('type').notNull().default('unknown'),
  hr_samples:       text('hr_samples'), // JSON: [{t:number,hr:number}]
  zone_seconds:     text('zone_seconds'), // JSON: {z1:number,z2:number,z3:number,z4:number,z5:number}
  threshold_hr:     real('threshold_hr'), // FTHR used to compute zones for this activity
  trimp:            real('trimp'),
  finalized:        integer('finalized').notNull().default(0),
  is_manual:        integer('is_manual').notNull().default(0),
  timezone:         text('timezone'), // IANA tz at time of recording, e.g. 'Europe/London'
  created_at:       integer('created_at').notNull(),
}, (t) => [
  index('activity_events_date_idx').on(t.date),
]);

// ─── notifications ───────────────────────────────────────────────────────────

export const notifications = sqliteTable('notifications', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  type:        text('type').notNull(),
  payload:     text('payload'), // JSON: {"screen","activityId|sleepId","start_ts","end_ts","duration_minutes","sport","score","avg_hr"}
  read:        integer('read').notNull().default(0),
  entity_type: text('entity_type'), // 'sleep' | 'activity' — used for upsert dedup
  entity_id:   integer('entity_id'),
  created_at:  integer('created_at').notNull(),
}, (t) => [
  index('notifications_created_idx').on(t.created_at),
]);

// ─── Inferred types ──────────────────────────────────────────────────────────

export type R24Record        = typeof r24.$inferSelect;
export type DailyAggregation = typeof dailyAggregations.$inferSelect;
export type SleepEvent       = typeof sleepEvents.$inferSelect;
export type ActivityEvent    = typeof activityEvents.$inferSelect;
export type Notification     = typeof notifications.$inferSelect;

export interface ZoneSeconds { z1: number; z2: number; z3: number; z4: number; z5: number }
