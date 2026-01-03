import { create } from "zustand";
import { getDatabase } from "../database/init";
import { DailyCompletion, DailySnapshot, WeeklyPlanExercise } from "../types";

interface ExerciseStore {
  weeklyPlan: Record<number, WeeklyPlanExercise[]>;
  todaySnapshot: DailySnapshot[];
  todayCompletion: DailyCompletion | null;
  refreshCounter: number;
  weeklyPlanCounter: number;
  completionCounter: number;

  incrementWeeklyPlanCounter: () => void;
  incrementCompletionCounter: () => void;

  loadWeeklyPlan: () => Promise<void>;
  saveExerciseToDay: (
    dayOfWeek: number,
    exercise: Omit<WeeklyPlanExercise, "id" | "day_of_week">
  ) => Promise<void>;
  updateExercise: (
    id: number,
    exercise: Omit<WeeklyPlanExercise, "id" | "day_of_week">
  ) => Promise<void>;
  deleteExercise: (id: number, dayOfWeek: number) => Promise<void>;
  copyDayPlan: (fromDay: number, toDay: number) => Promise<void>;

  loadTodayData: () => Promise<void>;
  createTodaySnapshot: () => Promise<void>;
  toggleTodayCompletion: () => Promise<void>;
  updateElapsedTime: (seconds: number) => Promise<void>;
  updateTimerStartTime: (seconds: number) => Promise<void>;
  updateDayElapsedTime: (date: string, seconds: number) => Promise<void>;

  loadDayData: (date: string) => Promise<{
    snapshot: DailySnapshot[];
    completion: DailyCompletion | null;
  }>;
  toggleDayCompletion: (date: string) => Promise<void>;
  updateDailyExercise: (
    id: number,
    exercise: Omit<DailySnapshot, "id" | "date">
  ) => Promise<void>;
  saveDailyExercise: (
    date: string,
    exercise: Omit<DailySnapshot, "id" | "date">
  ) => Promise<void>;
  deleteDailyExercise: (id: number) => Promise<void>;
  incrementRefreshCounter: () => void;
}

function getTodayDate(): string {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - timezoneOffset);
  return localDate.toISOString().split("T")[0];
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  weeklyPlan: {},
  todaySnapshot: [],
  todayCompletion: null,
  refreshCounter: 0,
  weeklyPlanCounter: 0,
  completionCounter: 0,

  loadWeeklyPlan: async () => {
    const db = getDatabase();
    const exercises = await db.getAllAsync<WeeklyPlanExercise>(
      "SELECT * FROM weekly_plan ORDER BY day_of_week, sort_order"
    );

    const grouped: Record<number, WeeklyPlanExercise[]> = {};
    for (let i = 0; i < 7; i++) {
      grouped[i] = [];
    }

    exercises.forEach((ex) => {
      grouped[ex.day_of_week].push(ex);
    });

    set({ weeklyPlan: grouped });
  },

  saveExerciseToDay: async (dayOfWeek, exercise) => {
    try {
      const db = getDatabase();
      const maxOrder = await db.getFirstAsync<{ max_order: number }>(
        "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM weekly_plan WHERE day_of_week = ?",
        [dayOfWeek]
      );

      const newOrder = (maxOrder?.max_order ?? -1) + 1;

      await db.runAsync(
        "INSERT INTO weekly_plan (day_of_week, exercise_name, icon_name, icon_family, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          dayOfWeek,
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets,
          exercise.reps,
          newOrder,
        ]
      );

      await get().loadWeeklyPlan();

      // If adding to today's day, recreate today snapshot
      const today = new Date();
      const timezoneOffset = today.getTimezoneOffset() * 60000;
      const localDate = new Date(today.getTime() - timezoneOffset);
      const todayDayOfWeek = localDate.getDay();
      const adjustedTodayDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

      if (dayOfWeek === adjustedTodayDay) {
        await get().createTodaySnapshot();
        get().incrementWeeklyPlanCounter();
      }
    } catch (error) {
      console.error("Error saving exercise to day:", error);
      throw new Error("Failed to save exercise. Please try again.");
    }
  },

  updateExercise: async (id, exercise) => {
    try {
      const db = getDatabase();
      await db.runAsync(
        "UPDATE weekly_plan SET exercise_name = ?, icon_name = ?, icon_family = ?, sets = ?, reps = ? WHERE id = ?",
        [
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets,
          exercise.reps,
          id,
        ]
      );

      await get().loadWeeklyPlan();

      // If updating today's day, refresh today data
      const today = new Date();
      const timezoneOffset = today.getTimezoneOffset() * 60000;
      const localDate = new Date(today.getTime() - timezoneOffset);
      const todayDayOfWeek = localDate.getDay();
      const adjustedTodayDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

      const exerciseDay = await db.getFirstAsync<{ day_of_week: number }>(
        "SELECT day_of_week FROM weekly_plan WHERE id = ?",
        [id]
      );

      if (exerciseDay?.day_of_week === adjustedTodayDay) {
        await get().createTodaySnapshot();
        get().incrementWeeklyPlanCounter();
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
      throw new Error("Failed to update exercise. Please try again.");
    }
  },

  deleteExercise: async (id, dayOfWeek) => {
    try {
      const db = getDatabase();
      await db.runAsync("DELETE FROM weekly_plan WHERE id = ?", [id]);

      const remaining = await db.getAllAsync<WeeklyPlanExercise>(
        "SELECT * FROM weekly_plan WHERE day_of_week = ? ORDER BY sort_order",
        [dayOfWeek]
      );

      for (let i = 0; i < remaining.length; i++) {
        const id = remaining[i].id;
        if (id !== undefined) {
          await db.runAsync(
            "UPDATE weekly_plan SET sort_order = ? WHERE id = ?",
            [i, id]
          );
        }
      }

      await get().loadWeeklyPlan();

      // If deleting from today's day, refresh today data
      const today = new Date();
      const timezoneOffset = today.getTimezoneOffset() * 60000;
      const localDate = new Date(today.getTime() - timezoneOffset);
      const todayDayOfWeek = localDate.getDay();
      const adjustedTodayDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

      if (dayOfWeek === adjustedTodayDay) {
        await get().createTodaySnapshot();
        get().incrementWeeklyPlanCounter();
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw new Error("Failed to delete exercise. Please try again.");
    }
  },

  copyDayPlan: async (fromDay, toDay) => {
    const db = getDatabase();

    await db.runAsync("DELETE FROM weekly_plan WHERE day_of_week = ?", [toDay]);

    const source = await db.getAllAsync<WeeklyPlanExercise>(
      "SELECT * FROM weekly_plan WHERE day_of_week = ? ORDER BY sort_order",
      [fromDay]
    );

    for (const ex of source) {
      await db.runAsync(
        "INSERT INTO weekly_plan (day_of_week, exercise_name, icon_name, icon_family, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          toDay,
          ex.exercise_name,
          ex.icon_name,
          ex.icon_family,
          ex.sets,
          ex.reps,
          ex.sort_order,
        ]
      );
    }

    await get().loadWeeklyPlan();
  },

  loadTodayData: async () => {
    const today = getTodayDate();
    const db = getDatabase();

    const snapshot = await db.getAllAsync<DailySnapshot>(
      "SELECT * FROM daily_snapshot WHERE date = ? ORDER BY sort_order",
      [today]
    );

    const completion = await db.getFirstAsync<DailyCompletion>(
      "SELECT * FROM daily_completion WHERE date = ?",
      [today]
    );

    set({
      todaySnapshot: snapshot,
      todayCompletion: completion || null,
    });
  },

  createTodaySnapshot: async () => {
    try {
      const today = getTodayDate();
      const db = getDatabase();

      // Always recreate today's snapshot from weekly plan
      await db.runAsync("DELETE FROM daily_snapshot WHERE date = ?", [today]);

      const dayOfWeek = new Date().getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const plan = await db.getAllAsync<WeeklyPlanExercise>(
        "SELECT * FROM weekly_plan WHERE day_of_week = ? ORDER BY sort_order",
        [adjustedDay]
      );

      console.log(
        `Creating snapshot for day ${adjustedDay}, found ${plan.length} exercises`
      );

      for (const ex of plan) {
        await db.runAsync(
          "INSERT INTO daily_snapshot (date, exercise_name, icon_name, icon_family, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            today,
            ex.exercise_name,
            ex.icon_name,
            ex.icon_family,
            ex.sets,
            ex.reps,
            ex.sort_order,
          ]
        );
      }

      const completionExists = await db.getFirstAsync(
        "SELECT id FROM daily_completion WHERE date = ?",
        [today]
      );

      if (!completionExists) {
        await db.runAsync(
          "INSERT INTO daily_completion (date, is_completed, elapsed_seconds) VALUES (?, 0, 0)",
          [today]
        );
      }

      await get().loadTodayData();
    } catch (error) {
      console.error("Error creating today snapshot:", error);
      throw new Error(
        "Failed to create today's workout plan. Please try again."
      );
    }
  },

  toggleTodayCompletion: async () => {
    const today = getTodayDate();
    const db = getDatabase();
    const current = get().todayCompletion;

    if (!current) {
      await db.runAsync(
        "INSERT INTO daily_completion (date, is_completed, completed_at, elapsed_seconds) VALUES (?, 1, ?, 0)",
        [today, new Date().toISOString()]
      );
    } else {
      const newStatus = current.is_completed ? 0 : 1;
      const completedAt = newStatus ? new Date().toISOString() : null;

      await db.runAsync(
        "UPDATE daily_completion SET is_completed = ?, completed_at = ? WHERE date = ?",
        [newStatus, completedAt, today]
      );
    }

    await get().loadTodayData();
    get().incrementCompletionCounter();
  },

  updateElapsedTime: async (seconds) => {
    const today = getTodayDate();
    const db = getDatabase();

    await db.runAsync(
      "UPDATE daily_completion SET elapsed_seconds = ? WHERE date = ?",
      [seconds, today]
    );

    await get().loadTodayData();
  },

  updateTimerStartTime: async (seconds: number) => {
    const today = getTodayDate();
    const db = getDatabase();

    await db.runAsync(
      "UPDATE daily_completion SET timer_start_seconds = ? WHERE date = ?",
      [seconds, today]
    );

    await get().loadTodayData();
  },

  updateDayElapsedTime: async (date: string, seconds: number) => {
    const db = getDatabase();

    await db.runAsync(
      "UPDATE daily_completion SET elapsed_seconds = ? WHERE date = ?",
      [seconds, date]
    );

    await get().loadDayData(date);
    get().incrementCompletionCounter();
  },

  loadDayData: async (date) => {
    const db = getDatabase();

    const snapshot = await db.getAllAsync<DailySnapshot>(
      "SELECT * FROM daily_snapshot WHERE date = ? ORDER BY sort_order",
      [date]
    );

    const completion = await db.getFirstAsync<DailyCompletion>(
      "SELECT * FROM daily_completion WHERE date = ?",
      [date]
    );

    return {
      snapshot,
      completion: completion || null,
    };
  },

  toggleDayCompletion: async (date) => {
    const db = getDatabase();
    const current = await db.getFirstAsync<DailyCompletion>(
      "SELECT * FROM daily_completion WHERE date = ?",
      [date]
    );

    if (!current) {
      await db.runAsync(
        "INSERT INTO daily_completion (date, is_completed, completed_at, elapsed_seconds) VALUES (?, 1, ?, 0)",
        [date, new Date().toISOString()]
      );
    } else {
      const newStatus = current.is_completed ? 0 : 1;
      const completedAt = newStatus ? new Date().toISOString() : null;

      await db.runAsync(
        "UPDATE daily_completion SET is_completed = ?, completed_at = ? WHERE date = ?",
        [newStatus, completedAt, date]
      );
    }

    get().incrementCompletionCounter();
  },

  updateDailyExercise: async (id, exercise) => {
    try {
      const db = getDatabase();
      await db.runAsync(
        "UPDATE daily_snapshot SET exercise_name = ?, icon_name = ?, icon_family = ?, sets = ?, reps = ? WHERE id = ?",
        [
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets,
          exercise.reps,
          id,
        ]
      );

      get().incrementCompletionCounter();
    } catch (error) {
      console.error("Error updating daily exercise:", error);
      throw new Error("Failed to update exercise. Please try again.");
    }
  },

  saveDailyExercise: async (date, exercise) => {
    try {
      const db = getDatabase();
      const maxOrder = await db.getFirstAsync<{ max_order: number }>(
        "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM daily_snapshot WHERE date = ?",
        [date]
      );

      const newOrder = (maxOrder?.max_order ?? -1) + 1;

      await db.runAsync(
        "INSERT INTO daily_snapshot (date, exercise_name, icon_name, icon_family, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          date,
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets,
          exercise.reps,
          newOrder,
        ]
      );

      get().incrementCompletionCounter();
    } catch (error) {
      console.error("Error saving daily exercise:", error);
      throw new Error("Failed to save exercise. Please try again.");
    }
  },

  deleteDailyExercise: async (id) => {
    try {
      const db = getDatabase();
      await db.runAsync("DELETE FROM daily_snapshot WHERE id = ?", [id]);

      get().incrementRefreshCounter();
    } catch (error) {
      console.error("Error deleting daily exercise:", error);
      throw new Error("Failed to delete exercise. Please try again.");
    }
  },

  incrementRefreshCounter: () => {
    set({ refreshCounter: get().refreshCounter + 1 });
  },

  incrementWeeklyPlanCounter: () => {
    set({ weeklyPlanCounter: get().weeklyPlanCounter + 1 });
  },

  incrementCompletionCounter: () => {
    set({ completionCounter: get().completionCounter + 1 });
  },
}));
