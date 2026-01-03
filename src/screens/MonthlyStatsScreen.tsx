import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getDatabase } from "../database/init";
import { DailyCompletion, DailySnapshot } from "../types";

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
}

export default function MonthlyStatsScreen({ route }: any) {
  const { month } = route.params;
  const [stats, setStats] = useState<{
    daysCompleted: number;
    totalDays: number;
    totalTime: number;
    longestStreak: number;
    currentStreak: number;
    exerciseStats: ExerciseStats[];
  }>({
    daysCompleted: 0,
    totalDays: 0,
    totalTime: 0,
    longestStreak: 0,
    currentStreak: 0,
    exerciseStats: [],
  });

  useEffect(() => {
    loadStats();
  }, [month]);

  const loadStats = async () => {
    const dates = getMonthDates(new Date(month));
    const db = getDatabase();

    let completed = 0;
    let totalTime = 0;
    const exerciseMap = new Map<string, ExerciseStats>();

    const completions: boolean[] = [];

    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );

      if (completion?.is_completed) {
        completed++;
        totalTime += completion.elapsed_seconds;
        completions.push(true);

        const exercises = await db.getAllAsync<DailySnapshot>(
          "SELECT * FROM daily_snapshot WHERE date = ?",
          [date]
        );

        exercises.forEach((ex) => {
          const existing = exerciseMap.get(ex.exercise_name);
          if (existing) {
            existing.totalSets += ex.sets;
            existing.totalReps += ex.sets * ex.reps;
          } else {
            exerciseMap.set(ex.exercise_name, {
              name: ex.exercise_name,
              totalSets: ex.sets,
              totalReps: ex.sets * ex.reps,
            });
          }
        });
      } else {
        completions.push(false);
      }
    }

    const streaks = calculateStreaks(completions);

    setStats({
      daysCompleted: completed,
      totalDays: dates.length,
      totalTime,
      longestStreak: streaks.longest,
      currentStreak: streaks.current,
      exerciseStats: Array.from(exerciseMap.values()),
    });
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    const dates = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const calculateStreaks = (completions: boolean[]) => {
    let longest = 0;
    let current = 0;
    let temp = 0;

    for (let i = 0; i < completions.length; i++) {
      if (completions[i]) {
        temp++;
        if (temp > longest) longest = temp;
      } else {
        temp = 0;
      }
    }

    for (let i = completions.length - 1; i >= 0; i--) {
      if (completions[i]) {
        current++;
      } else {
        break;
      }
    }

    return { longest, current };
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Overview</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days Completed</Text>
            <Text style={styles.statValue}>
              {stats.daysCompleted} / {stats.totalDays}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Completion Rate</Text>
            <Text style={styles.statValue}>
              {stats.totalDays > 0
                ? Math.round((stats.daysCompleted / stats.totalDays) * 100)
                : 0}
              %
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Training Time</Text>
            <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={styles.statValue}>{stats.longestStreak} days</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{stats.currentStreak} days</Text>
          </View>
        </View>
      </View>

      {stats.exerciseStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exercise Breakdown</Text>

          <View style={styles.exerciseList}>
            {stats.exerciseStats.map((ex, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.exerciseStatsRow}>
                  <Text style={styles.exerciseStat}>
                    Total Sets: {ex.totalSets}
                  </Text>
                  <Text style={styles.exerciseStat}>
                    Total Reps: {ex.totalReps}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#6b7280",
  },
  statValue: {
    fontWeight: "600",
    color: "#111827",
  },
  exerciseList: {
    gap: 12,
  },
  exerciseItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
  },
  exerciseName: {
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  exerciseStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseStat: {
    fontSize: 14,
    color: "#6b7280",
  },
});
