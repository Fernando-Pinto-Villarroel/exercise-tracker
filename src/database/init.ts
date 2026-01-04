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

  // Add estimated_time column to weekly_plan if it doesn't exist
  try {
    await db.execAsync(`
      ALTER TABLE weekly_plan ADD COLUMN estimated_time INTEGER;
    `);
  } catch (error) {
    // Column already exists or other error - ignore
    console.log(
      "Weekly plan estimated_time addition result:",
      (error as Error).message
    );
  }

  // Add estimated_time column to daily_snapshot if it doesn't exist
  try {
    await db.execAsync(`
      ALTER TABLE daily_snapshot ADD COLUMN estimated_time INTEGER;
    `);
  } catch (error) {
    // Column already exists or other error - ignore
    console.log(
      "Daily snapshot estimated_time addition result:",
      (error as Error).message
    );
  }

  // Fix daily_snapshot unique constraint and update schema
  try {
    // Check if the table has the wrong schema
    const result = await db.getFirstAsync("PRAGMA table_info(daily_snapshot)");
    if (result) {
      // Drop and recreate with new schema
      await db.execAsync(`
        DROP TABLE daily_snapshot;
        CREATE TABLE daily_snapshot (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          exercise_name TEXT NOT NULL,
          icon_name TEXT NOT NULL,
          icon_family TEXT NOT NULL,
          sets INTEGER,
          reps INTEGER,
          estimated_time INTEGER,
          sort_order INTEGER NOT NULL
        );
      `);
    }
  } catch (error) {
    console.log("Daily snapshot fix result:", (error as Error).message);
  }
}
