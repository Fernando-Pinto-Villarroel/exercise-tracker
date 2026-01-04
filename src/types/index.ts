export interface UserInfo {
  id?: number;
  full_name: string;
  age: number;
  height: number;
  weight: number;
  created_at: string;
  language?: string;
  theme?: string;
}

export interface Exercise {
  id?: number;
  exercise_name: string;
  icon_name: string;
  icon_family: string;
  sets?: number;
  reps?: number;
  estimated_time?: number;
  sort_order: number;
}

export interface WeeklyPlanExercise extends Exercise {
  day_of_week: number;
}

export interface DailySnapshot extends Exercise {
  date: string;
}

export interface DailyCompletion {
  id?: number;
  date: string;
  is_completed: boolean;
  completed_at?: string;
  elapsed_seconds: number;
  timer_start_seconds?: number;
}

export interface ExportData {
  version: string;
  exported_at: string;
  user_info: UserInfo[];
  weekly_plan: WeeklyPlanExercise[];
  daily_snapshots: DailySnapshot[];
  daily_completions: DailyCompletion[];
}
