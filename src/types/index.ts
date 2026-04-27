export interface UserInfo {
  id?: number;
  full_name: string;
  birthday: string;
  gender: "male" | "female";
  created_at: string;
  language?: string;
  theme?: string;
  color_palette?: string;
}

export interface BodyRecord {
  id?: number;
  user_id: number;
  date: string;
  weight: number;
  height: number;
  neck_perimeter?: number;
  waist_perimeter?: number;
  hip_perimeter?: number;
  bicep_perimeter?: number;
  thigh_perimeter?: number;
  calf_perimeter?: number;
  shoulder_perimeter?: number;
  created_at: string;
}

export interface Exercise {
  id?: number;
  exercise_name: string;
  icon_name: string;
  icon_family: string;
  sets?: number;
  reps?: number;
  estimated_time?: number;
  training_reference_url?: string;
  rest_time_between_sets?: number;
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
  training_time: number;
  is_rest_day?: boolean;
  rest_day_override?: number;
}

export interface WeeklyRestDay {
  day_of_week: number;
  created_at: string;
  removed_at?: string | null;
}

export interface NotificationSettings {
  id?: number;
  notifications_per_day: number;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
  enabled_days: string;
}

export interface ExportData {
  version: string;
  schema_version: number;
  exported_at: string;
  user_info: UserInfo[];
  body_records: BodyRecord[];
  weekly_plan: WeeklyPlanExercise[];
  weekly_rest_days: WeeklyRestDay[];
  daily_snapshots: DailySnapshot[];
  daily_completions: DailyCompletion[];
  notification_settings?: NotificationSettings;
}

export interface RoutineExportData {
  version: string;
  schema_version: number;
  exported_at: string;
  type: "routine";
  weekly_plan: WeeklyPlanExercise[];
  weekly_rest_days: WeeklyRestDay[];
}

export interface ExerciseProgress {
  exerciseId: number;
  currentSets: number;
  currentTime: number;
}
