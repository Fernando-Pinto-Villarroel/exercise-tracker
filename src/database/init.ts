import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

async function getCurrentSchemaVersion(
  database: SQLite.SQLiteDatabase
): Promise<number> {
  try {
    const result = await database.getFirstAsync<{ version: number }>(
      "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
    );
    return result?.version || 0;
  } catch (error) {
    // Table doesn't exist yet, return 0
    return 0;
  }
}

async function setSchemaVersion(
  database: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  await database.runAsync(
    "INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
    [version, new Date().toISOString()]
  );
}

async function applyMigration1(database: SQLite.SQLiteDatabase): Promise<void> {
  console.log("Applying migration 1: Adding rest day support");

  await database.execAsync(`
    -- Create schema version table
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    -- Create weekly rest days table
    CREATE TABLE IF NOT EXISTS weekly_rest_days (
      day_of_week INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL
    );
  `);

  // Check if is_rest_day column already exists
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(daily_completion)"
  );
  const hasRestDayColumn = tableInfo.some((col) => col.name === "is_rest_day");

  if (!hasRestDayColumn) {
    await database.execAsync(`
      ALTER TABLE daily_completion
      ADD COLUMN is_rest_day INTEGER DEFAULT 0 NOT NULL;
    `);
  }

  await setSchemaVersion(database, 1);
  console.log("Migration 1 applied successfully");
}

async function applyMigration2(database: SQLite.SQLiteDatabase): Promise<void> {
  console.log("Applying migration 2: Adding training reference URL support");

  // Check if training_reference_url column already exists in weekly_plan
  const weeklyPlanInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(weekly_plan)"
  );
  const hasWeeklyPlanUrl = weeklyPlanInfo.some(
    (col) => col.name === "training_reference_url"
  );

  if (!hasWeeklyPlanUrl) {
    await database.execAsync(`
      ALTER TABLE weekly_plan
      ADD COLUMN training_reference_url TEXT;
    `);
  }

  // Check if training_reference_url column already exists in daily_snapshot
  const dailySnapshotInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(daily_snapshot)"
  );
  const hasDailySnapshotUrl = dailySnapshotInfo.some(
    (col) => col.name === "training_reference_url"
  );

  if (!hasDailySnapshotUrl) {
    await database.execAsync(`
      ALTER TABLE daily_snapshot
      ADD COLUMN training_reference_url TEXT;
    `);
  }

  await setSchemaVersion(database, 2);
  console.log("Migration 2 applied successfully");
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getCurrentSchemaVersion(database);
  console.log(`Current schema version: ${currentVersion}`);

  if (currentVersion < 1) {
    await applyMigration1(database);
  }

  if (currentVersion < 2) {
    await applyMigration2(database);
  }

  console.log("All migrations completed");
}

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync("exercise_tracker.db");

  // Create base tables if they don't exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      created_at TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      theme TEXT DEFAULT 'light'
    );

    CREATE TABLE IF NOT EXISTS body_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      height REAL NOT NULL,
      neck_perimeter REAL,
      waist_perimeter REAL,
      hip_perimeter REAL,
      bicep_perimeter REAL,
      thigh_perimeter REAL,
      calf_perimeter REAL,
      shoulder_perimeter REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_info(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_plan (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       day_of_week INTEGER NOT NULL,
       exercise_name TEXT NOT NULL,
       icon_name TEXT NOT NULL,
       icon_family TEXT NOT NULL,
       sets INTEGER DEFAULT 0,
       reps INTEGER DEFAULT 0,
       estimated_time INTEGER DEFAULT 0,
       sort_order INTEGER NOT NULL,
       UNIQUE(day_of_week, sort_order)
     );

    CREATE TABLE IF NOT EXISTS daily_snapshot (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       date TEXT NOT NULL,
       exercise_name TEXT NOT NULL,
       icon_name TEXT NOT NULL,
       icon_family TEXT NOT NULL,
       sets INTEGER DEFAULT 0,
       reps INTEGER DEFAULT 0,
       estimated_time INTEGER DEFAULT 0,
       sort_order INTEGER NOT NULL
     );

    CREATE TABLE IF NOT EXISTS daily_completion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      training_time INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Run migrations
  await runMigrations(db);

  return db;
}

export function getDatabase() {
  return db;
}
