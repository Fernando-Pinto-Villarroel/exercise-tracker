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
      created_at TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      theme TEXT DEFAULT 'light'
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

  // await addMissingColumns();

  return db;
}

export function getDatabase() {
  return db;
}

export async function addMissingColumns() {
  try {
    await db.execAsync(`
      ALTER TABLE daily_completion ADD COLUMN timer_start_seconds INTEGER;
    `);
  } catch (error) {
    console.log("Column timer_start_seconds result:", (error as Error).message);
  }

  try {
    await db.execAsync(`
      ALTER TABLE weekly_plan ADD COLUMN estimated_time INTEGER;
    `);
  } catch (error) {
    console.log(
      "Weekly plan estimated_time addition result:",
      (error as Error).message
    );
  }

  try {
    await db.execAsync(`
      ALTER TABLE daily_snapshot ADD COLUMN estimated_time INTEGER;
    `);
  } catch (error) {
    console.log(
      "Daily snapshot estimated_time addition result:",
      (error as Error).message
    );
  }

  try {
    await db.execAsync(`
      ALTER TABLE user_info ADD COLUMN language TEXT DEFAULT 'en';
    `);
  } catch (error) {
    console.log("User language column result:", (error as Error).message);
  }

  try {
    await db.execAsync(`
      ALTER TABLE user_info ADD COLUMN theme TEXT DEFAULT 'light';
    `);
  } catch (error) {
    console.log("User theme column result:", (error as Error).message);
  }

  try {
    const result = await db.getFirstAsync("PRAGMA table_info(daily_snapshot)");
    if (result) {
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
