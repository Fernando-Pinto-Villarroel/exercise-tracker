import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync("exercise_tracker.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      height REAL NOT NULL,
      weight REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL,
      exercise_name TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      icon_family TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      UNIQUE(day_of_week, sort_order)
    );

    CREATE TABLE IF NOT EXISTS daily_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      exercise_name TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      icon_family TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_completion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      elapsed_seconds INTEGER NOT NULL DEFAULT 0,
      timer_start_seconds INTEGER
    );
  `);

  return db;
}

export function getDatabase() {
  return db;
}

// Add column if it doesn't exist for existing databases
export async function addMissingColumns() {
  try {
    await db.execAsync(`
      ALTER TABLE daily_completion ADD COLUMN timer_start_seconds INTEGER;
    `);
  } catch (error) {
    // Column already exists or other error - ignore
    console.log("Column addition result:", (error as Error).message);
  }
}
