import type { HabitType } from '../../../services/database/drizzle/schema';

interface HabitSeedEntry {
  name_key: string;
  type: HabitType;
  unit: string | null;
  default_quantity: number;
  sort_order: number;
}

export const HABIT_SEED: HabitSeedEntry[] = [
  // Sleep
  {
    name_key: 'habits.catalog.noScreensBeforeBed',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 10,
  },
  {
    name_key: 'habits.catalog.heavyMealBeforeBed',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 11,
  },

  // Stimulants
  {
    name_key: 'habits.catalog.caffeine',
    type: 'count',
    unit: 'cups',
    default_quantity: 1,
    sort_order: 20,
  },
  {
    name_key: 'habits.catalog.preworkout',
    type: 'count',
    unit: 'servings',
    default_quantity: 1,
    sort_order: 21,
  },
  {
    name_key: 'habits.catalog.energyDrink',
    type: 'count',
    unit: 'cans',
    default_quantity: 1,
    sort_order: 22,
  },
  {
    name_key: 'habits.catalog.alcohol',
    type: 'count',
    unit: 'drinks',
    default_quantity: 1,
    sort_order: 23,
  },

  // Training
  {
    name_key: 'habits.catalog.strengthTraining',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 30,
  },
  {
    name_key: 'habits.catalog.cardio',
    type: 'duration',
    unit: 'minutes',
    default_quantity: 30,
    sort_order: 31,
  },
  {
    name_key: 'habits.catalog.fastedTraining',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 32,
  },
  {
    name_key: 'habits.catalog.restDay',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 33,
  },
  {
    name_key: 'habits.catalog.stretching',
    type: 'duration',
    unit: 'minutes',
    default_quantity: 15,
    sort_order: 34,
  },

  // Recovery & wellness
  {
    name_key: 'habits.catalog.coldPlunge',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 40,
  },
  {
    name_key: 'habits.catalog.sauna',
    type: 'duration',
    unit: 'minutes',
    default_quantity: 20,
    sort_order: 41,
  },
  {
    name_key: 'habits.catalog.massage',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 42,
  },

  // Mental
  {
    name_key: 'habits.catalog.meditation',
    type: 'duration',
    unit: 'minutes',
    default_quantity: 10,
    sort_order: 50,
  },
  {
    name_key: 'habits.catalog.journaling',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 51,
  },
  {
    name_key: 'habits.catalog.highStress',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 52,
  },

  // Substances
  {
    name_key: 'habits.catalog.creatine',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 60,
  },
  {
    name_key: 'habits.catalog.cannabis',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 61,
  },
  {
    name_key: 'habits.catalog.nicotine',
    type: 'boolean',
    unit: null,
    default_quantity: 1,
    sort_order: 62,
  },
];
