import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProgressChart } from "react-native-chart-kit";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { DailyCompletion, DailySnapshot } from "../types";

const { width } = Dimensions.get("window");

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
  totalTime: number;
  daysPerformed: number;
}

export default function WeeklyStatsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [stats, setStats] = useState<{
    daysCompleted: number;
    totalDays: number;
    totalTime: number;
    exerciseStats: ExerciseStats[];
  }>({
    daysCompleted: 0,
    totalDays: 7,
    totalTime: 0,
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
        }

        const exercises = await db.getAllAsync<DailySnapshot>(
          "SELECT * FROM daily_snapshot WHERE date = ?",
          [date]
        );

        exercises.forEach((ex) => {
          if (
            (ex.sets && ex.reps && ex.sets > 0 && ex.reps > 0) ||
            (ex.estimated_time && ex.estimated_time > 0)
          ) {
            const existing = exerciseMap.get(ex.exercise_name);
            if (existing) {
              if (ex.sets && ex.reps && ex.sets > 0 && ex.reps > 0) {
                existing.totalSets += ex.sets;
                existing.totalReps += ex.sets * ex.reps;
              }
              if (ex.estimated_time) {
                existing.totalTime += ex.estimated_time;
              }
              existing.daysPerformed += 1;
            } else {
              exerciseMap.set(ex.exercise_name, {
                name: ex.exercise_name,
                totalSets:
                  ex.sets && ex.reps && ex.sets > 0 && ex.reps > 0
                    ? ex.sets
                    : 0,
                totalReps:
                  ex.sets && ex.reps && ex.sets > 0 && ex.reps > 0
                    ? ex.sets * ex.reps
                    : 0,
                totalTime: ex.estimated_time || 0,
                daysPerformed: 1,
              });
            }
          }
        });
      }
    }

    setStats({
      daysCompleted: completed,
      totalDays: 7,
      totalTime,
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

  const progressData = {
    labels: [t("weekly.completionRate")],
    data: [stats.daysCompleted / stats.totalDays],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
    strokeWidth: 2,
    propsForLabels: {
      fontSize: 12,
    },
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("weekly.weeklyOverview")}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.daysCompleted")}</Text>
            <Text style={styles.statValue}>
              {stats.daysCompleted} / {stats.totalDays}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.completionRate")}</Text>
            <Text style={styles.statValue}>
              {Math.round((stats.daysCompleted / stats.totalDays) * 100)}%
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>
              {t("weekly.totalTrainingTime")}
            </Text>
            <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>{t("weekly.completionRate")}</Text>
        <ProgressChart
          data={progressData}
          width={width - 64}
          height={150}
          strokeWidth={16}
          radius={60}
          chartConfig={chartConfig}
          hideLegend={true}
          style={styles.chart}
        />
      </View>

      {stats.exerciseStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("weekly.exerciseStats")}</Text>

          <View style={styles.exerciseList}>
            {stats.exerciseStats.map((ex, index) => {
              const avgSets =
                ex.daysPerformed > 0
                  ? (ex.totalSets / ex.daysPerformed).toFixed(1)
                  : "0";
              const avgReps =
                ex.daysPerformed > 0
                  ? (ex.totalReps / ex.daysPerformed).toFixed(0)
                  : "0";
              const avgTime =
                ex.daysPerformed > 0
                  ? Math.round(ex.totalTime / ex.daysPerformed)
                  : 0;

              return (
                <View key={index} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <View style={styles.exerciseStatsRow}>
                    {ex.totalSets > 0 && (
                      <>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.totalSets")}: {ex.totalSets}
                        </Text>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.averageSets")}: {avgSets}
                        </Text>
                      </>
                    )}
                    {ex.totalReps > 0 && (
                      <>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.totalReps")}: {ex.totalReps}
                        </Text>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.averageReps")}: {avgReps}
                        </Text>
                      </>
                    )}
                    {ex.totalTime > 0 && (
                      <>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.totalTime")}: {formatTime(ex.totalTime)}
                        </Text>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.averageTime")}: {formatTime(avgTime)}
                        </Text>
                      </>
                    )}
                    <Text style={styles.exerciseStat}>
                      {t("weekly.daysPerformed")}: {ex.daysPerformed}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    chart: {
      marginVertical: 8,
      borderRadius: 8,
    },
    statsContainer: {
      gap: 12,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 15,
    },
    statValue: {
      fontWeight: "600",
      color: theme.text,
      fontSize: 15,
    },
    exerciseList: {
      gap: 16,
    },
    exerciseItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      paddingBottom: 12,
    },
    exerciseName: {
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
      fontSize: 16,
    },
    exerciseStatsRow: {
      flexDirection: "column",
      gap: 6,
    },
    exerciseStat: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });
