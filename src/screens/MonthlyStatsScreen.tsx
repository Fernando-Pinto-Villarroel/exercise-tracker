import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, ProgressChart } from "react-native-chart-kit";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { useExerciseStore } from "../store/exerciseStore";
import { DailyCompletion, DailySnapshot } from "../types";

const { width } = Dimensions.get("window");

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
  totalTime: number;
  daysPerformed: number;
}

export default function MonthlyStatsScreen({ route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { month } = route.params;
  const { completionCounter } = useExerciseStore();
  const [stats, setStats] = useState<{
    daysCompleted: number;
    totalDays: number;
    totalTime: number;
    longestStreak: number;
    currentStreak: number;
    exerciseStats: ExerciseStats[];
    weeklyCompletions: number[];
  }>({
    daysCompleted: 0,
    totalDays: 0,
    totalTime: 0,
    longestStreak: 0,
    currentStreak: 0,
    exerciseStats: [],
    weeklyCompletions: [0, 0, 0, 0, 0],
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [month, completionCounter]),
  );

  const loadStats = async () => {
    const dates = getMonthDates(new Date(month));
    const db = getDatabase();

    let completed = 0;
    let totalTime = 0;
    const exerciseMap = new Map<string, ExerciseStats>();

    const completions: boolean[] = [];
    const weeklyCompletions: number[] = [0, 0, 0, 0, 0];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date],
      );

      const weekIndex = Math.min(Math.floor(i / 7), 4);

      if (completion?.is_completed) {
        completed++;
        totalTime += completion.training_time;
        completions.push(true);
        weeklyCompletions[weekIndex]++;

        const exercises = await db.getAllAsync<DailySnapshot>(
          "SELECT * FROM daily_snapshot WHERE date = ?",
          [date],
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
      weeklyCompletions,
    });
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    const dates = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const dateStr =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      dates.push(dateStr);
    }
    return dates;
  };

  const calculateStreaks = (completions: boolean[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const monthDate = new Date(month);
    const monthNum = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const todayIndex =
      today.getFullYear() === year && today.getMonth() === monthNum
        ? today.getDate() - 1
        : completions.length - 1;

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

    for (let i = Math.min(todayIndex, completions.length - 1); i >= 0; i--) {
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

  const progressData = {
    labels: [t("monthly.completionRate")],
    data: [stats.totalDays > 0 ? stats.daysCompleted / stats.totalDays : 0],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
    strokeWidth: 2,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const hasWeeklyData = stats.weeklyCompletions.some((val) => val > 0);

  const weeklyData = {
    labels: ["W1", "W2", "W3", "W4", "W5"],
    datasets: [
      {
        data: hasWeeklyData ? stats.weeklyCompletions : [0, 0, 0, 0, 0.1],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("monthly.monthlyOverview")}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.daysCompleted")}</Text>
            <Text style={styles.statValue}>
              {stats.daysCompleted} / {stats.totalDays}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("monthly.completionRate")}</Text>
            <Text style={styles.statValue}>
              {stats.totalDays > 0
                ? Math.round((stats.daysCompleted / stats.totalDays) * 100)
                : 0}
              %
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>
              {t("weekly.totalTrainingTime")}
            </Text>
            <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("monthly.longestStreak")}</Text>
            <Text style={styles.statValue}>
              {stats.longestStreak} {t("monthly.days")}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("monthly.currentStreak")}</Text>
            <Text style={styles.statValue}>
              {stats.currentStreak} {t("monthly.days")}
            </Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>{t("monthly.completionRate")}</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Completions</Text>
        {hasWeeklyData ? (
          <LineChart
            data={weeklyData}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero
            yAxisInterval={1}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {t("monthly.noDataAvailable")}
            </Text>
          </View>
        )}
      </View>

      {stats.exerciseStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("monthly.exerciseStats")}</Text>

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
                          {t("monthly.averageSets")}: {avgSets}
                        </Text>
                      </>
                    )}
                    {ex.totalReps > 0 && (
                      <>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.totalReps")}: {ex.totalReps}
                        </Text>
                        <Text style={styles.exerciseStat}>
                          {t("monthly.averageReps")}: {avgReps}
                        </Text>
                      </>
                    )}
                    {ex.totalTime > 0 && (
                      <>
                        <Text style={styles.exerciseStat}>
                          {t("weekly.totalTime")}: {formatTime(ex.totalTime)}
                        </Text>
                        <Text style={styles.exerciseStat}>
                          {t("monthly.averageTime")}: {formatTime(avgTime)}
                        </Text>
                      </>
                    )}
                    <Text style={styles.exerciseStat}>
                      {t("monthly.daysPerformed")}: {ex.daysPerformed}
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
    noDataContainer: {
      height: 220,
      justifyContent: "center",
      alignItems: "center",
    },
    noDataText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
  });
