import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync("exercise_tracker.db");

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
      elapsed_seconds INTEGER NOT NULL DEFAULT 0,
      timer_start_seconds INTEGER
    );
  `);

  return db;
}

export function getDatabase() {
  return db;
}
