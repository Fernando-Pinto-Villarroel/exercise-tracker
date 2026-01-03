import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getDatabase } from "../database/init";
import { DailyCompletion, DailySnapshot } from "../types";

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
}

export default function WeeklyStatsScreen() {
  const [stats, setStats] = useState<{
    daysCompleted: number;
    totalTime: number;
    earlyTraining: number;
    lateTraining: number;
    noTraining: number;
    exerciseStats: ExerciseStats[];
  }>({
    daysCompleted: 0,
    totalTime: 0,
    earlyTraining: 0,
    lateTraining: 0,
    noTraining: 0,
    exerciseStats: [],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const dates = getWeekDates();
    const db = getDatabase();

    let completed = 0;
    let totalTime = 0;
    let early = 0;
    let late = 0;
    let noTraining = 0;

    const exerciseMap = new Map<string, ExerciseStats>();

    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );

      if (completion) {
        if (completion.is_completed) {
          completed++;
          totalTime += completion.elapsed_seconds;

          if (completion.completed_at) {
            const hour = new Date(completion.completed_at).getHours();
            if (hour < 12) {
              early++;
            } else {
              late++;
            }
          }
        } else {
          noTraining++;
        }

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
        noTraining++;
      }
    }

    setStats({
      daysCompleted: completed,
      totalTime,
      earlyTraining: early,
      lateTraining: late,
      noTraining,
      exerciseStats: Array.from(exerciseMap.values()),
    });
  };

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Overview</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days Completed</Text>
            <Text style={styles.statValue}>{stats.daysCompleted} / 7</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Training Time</Text>
            <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Early Training (AM)</Text>
            <Text style={styles.statValue}>{stats.earlyTraining}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Late Training (PM)</Text>
            <Text style={styles.statValue}>{stats.lateTraining}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>No Training</Text>
            <Text style={styles.statValue}>{stats.noTraining}</Text>
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
