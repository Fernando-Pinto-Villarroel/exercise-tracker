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
  toggleTodayCompletion: (customTime?: string) => Promise<void>;
  updateTrainingTime: (date: string, seconds: number) => Promise<void>;

  loadDayData: (date: string) => Promise<{
    snapshot: DailySnapshot[];
    completion: DailyCompletion | null;
  }>;
  toggleDayCompletion: (date: string, customTime?: string) => Promise<void>;
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

  // Rest day methods
  toggleWeeklyRestDay: (dayOfWeek: number) => Promise<void>;
  toggleRestDay: (date: string) => Promise<void>;
  isRestDay: (date: string) => Promise<boolean>;
  loadWeeklyRestDays: () => Promise<number[]>;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
        "INSERT INTO weekly_plan (day_of_week, exercise_name, icon_name, icon_family, sets, reps, estimated_time, training_reference_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          dayOfWeek,
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets ?? null,
          exercise.reps ?? null,
          exercise.estimated_time ?? null,
          exercise.training_reference_url ?? null,
          newOrder,
        ]
      );

      await get().loadWeeklyPlan();

      const todayDayOfWeek = new Date().getDay();
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
        "UPDATE weekly_plan SET exercise_name = ?, icon_name = ?, icon_family = ?, sets = ?, reps = ?, estimated_time = ?, training_reference_url = ? WHERE id = ?",
        [
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets ?? null,
          exercise.reps ?? null,
          exercise.estimated_time ?? null,
          exercise.training_reference_url ?? null,
          id,
        ]
      );

      await get().loadWeeklyPlan();

      const todayDayOfWeek = new Date().getDay();
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

      const todayDayOfWeek = new Date().getDay();
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
        "INSERT INTO weekly_plan (day_of_week, exercise_name, icon_name, icon_family, sets, reps, estimated_time, training_reference_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          toDay,
          ex.exercise_name,
          ex.icon_name,
          ex.icon_family,
          ex.sets ?? null,
          ex.reps ?? null,
          ex.estimated_time ?? null,
          ex.training_reference_url ?? null,
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
          "INSERT INTO daily_snapshot (date, exercise_name, icon_name, icon_family, sets, reps, estimated_time, training_reference_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            today,
            ex.exercise_name,
            ex.icon_name,
            ex.icon_family,
            ex.sets ?? null,
            ex.reps ?? null,
            ex.estimated_time ?? null,
            ex.training_reference_url ?? null,
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
          "INSERT INTO daily_completion (date, is_completed, training_time) VALUES (?, 0, 0)",
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

  toggleTodayCompletion: async (customTime?: string) => {
    const today = getTodayDate();
    const db = getDatabase();
    const current = get().todayCompletion;

    if (!current) {
      const completedAt = customTime || new Date().toISOString();
      await db.runAsync(
        "INSERT INTO daily_completion (date, is_completed, completed_at, training_time) VALUES (?, 1, ?, 0)",
        [today, completedAt]
      );
    } else {
      const newStatus = current.is_completed ? 0 : 1;
      const completedAt = newStatus
        ? customTime || new Date().toISOString()
        : null;

      await db.runAsync(
        "UPDATE daily_completion SET is_completed = ?, completed_at = ? WHERE date = ?",
        [newStatus, completedAt, today]
      );
    }

    await get().loadTodayData();
    get().incrementCompletionCounter();
  },

  updateTrainingTime: async (date: string, seconds: number) => {
    const db = getDatabase();

    await db.runAsync(
      "UPDATE daily_completion SET training_time = ? WHERE date = ?",
      [seconds, date]
    );

    if (date === getTodayDate()) {
      await get().loadTodayData();
    }
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

  toggleDayCompletion: async (date, customTime?: string) => {
    const db = getDatabase();
    const current = await db.getFirstAsync<DailyCompletion>(
      "SELECT * FROM daily_completion WHERE date = ?",
      [date]
    );

    if (!current) {
      const completedAt = customTime || new Date().toISOString();
      await db.runAsync(
        "INSERT INTO daily_completion (date, is_completed, completed_at, training_time) VALUES (?, 1, ?, 0)",
        [date, completedAt]
      );
    } else {
      const newStatus = current.is_completed ? 0 : 1;
      const completedAt = newStatus
        ? customTime || new Date().toISOString()
        : null;

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
        "UPDATE daily_snapshot SET exercise_name = ?, icon_name = ?, icon_family = ?, sets = ?, reps = ?, estimated_time = ?, training_reference_url = ? WHERE id = ?",
        [
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets ?? null,
          exercise.reps ?? null,
          exercise.estimated_time ?? null,
          exercise.training_reference_url ?? null,
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
        "INSERT INTO daily_snapshot (date, exercise_name, icon_name, icon_family, sets, reps, estimated_time, training_reference_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          date,
          exercise.exercise_name,
          exercise.icon_name,
          exercise.icon_family,
          exercise.sets ?? null,
          exercise.reps ?? null,
          exercise.estimated_time ?? null,
          exercise.training_reference_url ?? null,
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

  toggleWeeklyRestDay: async (dayOfWeek: number) => {
    try {
      const db = getDatabase();

      // Check if this day_of_week is already a rest day
      const existing = await db.getFirstAsync<{ day_of_week: number }>(
        "SELECT day_of_week FROM weekly_rest_days WHERE day_of_week = ?",
        [dayOfWeek]
      );

      if (existing) {
        // Remove rest day pattern
        await db.runAsync(
          "DELETE FROM weekly_rest_days WHERE day_of_week = ?",
          [dayOfWeek]
        );
      } else {
        // Add rest day pattern
        await db.runAsync(
          "INSERT INTO weekly_rest_days (day_of_week, created_at) VALUES (?, ?)",
          [dayOfWeek, new Date().toISOString()]
        );

        // Clear exercises for this day from weekly_plan
        await db.runAsync(
          "DELETE FROM weekly_plan WHERE day_of_week = ?",
          [dayOfWeek]
        );

        // If today matches this day_of_week, clear today's snapshot
        const today = getTodayDate();
        const todayDayOfWeek = new Date().getDay();
        const adjustedDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

        if (adjustedDay === dayOfWeek) {
          await db.runAsync("DELETE FROM daily_snapshot WHERE date = ?", [
            today,
          ]);
        }
      }

      await get().loadWeeklyPlan();
      get().incrementWeeklyPlanCounter();
      get().incrementCompletionCounter();
    } catch (error) {
      console.error("Error toggling weekly rest day:", error);
      throw new Error("Failed to toggle rest day. Please try again.");
    }
  },

  toggleRestDay: async (date: string) => {
    try {
      const db = getDatabase();

      // Check if date already has a completion record
      const current = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );

      if (!current) {
        // Create new entry with rest day flag and clear any existing exercises
        await db.runAsync(
          "INSERT INTO daily_completion (date, is_completed, training_time, is_rest_day) VALUES (?, 0, 0, 1)",
          [date]
        );
        await db.runAsync("DELETE FROM daily_snapshot WHERE date = ?", [date]);
      } else {
        // Toggle rest day status
        const newRestDay = current.is_rest_day ? 0 : 1;

        if (newRestDay === 1) {
          // Setting as rest day: clear completion and exercises
          await db.runAsync(
            "UPDATE daily_completion SET is_rest_day = 1, is_completed = 0, completed_at = NULL, training_time = 0 WHERE date = ?",
            [date]
          );
          await db.runAsync("DELETE FROM daily_snapshot WHERE date = ?", [
            date,
          ]);
        } else {
          // Removing rest day status
          await db.runAsync(
            "UPDATE daily_completion SET is_rest_day = 0 WHERE date = ?",
            [date]
          );
        }
      }

      get().incrementCompletionCounter();
    } catch (error) {
      console.error("Error toggling rest day:", error);
      throw new Error("Failed to toggle rest day. Please try again.");
    }
  },

  isRestDay: async (date: string) => {
    try {
      const db = getDatabase();

      // Check if this is a past date
      const today = getTodayDate();
      const isPastDate = date < today;

      // For past dates: ONLY check individual rest day marking (ignore weekly pattern)
      if (isPastDate) {
        const dailyCompletion = await db.getFirstAsync<DailyCompletion>(
          "SELECT * FROM daily_completion WHERE date = ?",
          [date]
        );
        return dailyCompletion?.is_rest_day || false;
      }

      // For today and future dates: check weekly pattern first, then individual marking
      const dateObj = new Date(date + "T00:00:00");
      const dayOfWeek = dateObj.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const weeklyRest = await db.getFirstAsync<{ day_of_week: number }>(
        "SELECT day_of_week FROM weekly_rest_days WHERE day_of_week = ?",
        [adjustedDay]
      );

      if (weeklyRest) return true;

      // Then check explicit marking
      const dailyCompletion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );

      return dailyCompletion?.is_rest_day || false;
    } catch (error) {
      console.error("Error checking rest day:", error);
      return false;
    }
  },

  loadWeeklyRestDays: async () => {
    try {
      const db = getDatabase();
      const restDays = await db.getAllAsync<{ day_of_week: number }>(
        "SELECT day_of_week FROM weekly_rest_days ORDER BY day_of_week"
      );
      return restDays.map((rd) => rd.day_of_week);
    } catch (error) {
      console.error("Error loading weekly rest days:", error);
      return [];
    }
  },
}));
