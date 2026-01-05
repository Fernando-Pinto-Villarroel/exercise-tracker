import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, PieChart, ProgressChart } from "react-native-chart-kit";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { DailyCompletion, DailySnapshot } from "../types";

const { width } = Dimensions.get("window");

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
  totalTime: number;
}

export default function WeeklyStatsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [stats, setStats] = useState<{
    daysCompleted: number;
    totalTime: number;
    earlyTraining: number;
    lateTraining: number;
    noTraining: number;
    exerciseStats: ExerciseStats[];
    dailyCompletions: number[];
  }>({
    daysCompleted: 0,
    totalTime: 0,
    earlyTraining: 0,
    lateTraining: 0,
    noTraining: 0,
    exerciseStats: [],
    dailyCompletions: [],
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
    const dailyCompletions: number[] = [];

    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );

      if (completion) {
        if (completion.is_completed) {
          completed++;
          totalTime += completion.elapsed_seconds;
          dailyCompletions.push(1);

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
          dailyCompletions.push(0);
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
              });
            }
          }
        });
      } else {
        noTraining++;
        dailyCompletions.push(0);
      }
    }

    setStats({
      daysCompleted: completed,
      totalTime,
      earlyTraining: early,
      lateTraining: late,
      noTraining,
      exerciseStats: Array.from(exerciseMap.values()).slice(0, 5),
      dailyCompletions,
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

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 12,
    },
  };

  const dayLabels = [
    t("myExercises.days.monday").substring(0, 3),
    t("myExercises.days.tuesday").substring(0, 3),
    t("myExercises.days.wednesday").substring(0, 3),
    t("myExercises.days.thursday").substring(0, 3),
    t("myExercises.days.friday").substring(0, 3),
    t("myExercises.days.saturday").substring(0, 3),
    t("myExercises.days.sunday").substring(0, 3),
  ];

  const completionData = {
    labels: dayLabels,
    datasets: [
      {
        data: stats.dailyCompletions,
      },
    ],
  };

  const trainingTimeData = [
    {
      name: t("weekly.earlyTraining"),
      population: stats.earlyTraining,
      color: theme.primary,
      legendFontColor: theme.text,
    },
    {
      name: t("weekly.lateTraining"),
      population: stats.lateTraining,
      color: theme.success,
      legendFontColor: theme.text,
    },
    {
      name: t("weekly.noTraining"),
      population: stats.noTraining,
      color: theme.textTertiary,
      legendFontColor: theme.text,
    },
  ];

  const progressData = {
    labels: [t("weekly.completionRate")],
    data: [stats.daysCompleted / 7],
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("weekly.weeklyOverview")}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.daysCompleted")}</Text>
            <Text style={styles.statValue}>{stats.daysCompleted} / 7</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("weekly.daysCompleted")}</Text>
        <BarChart
          data={completionData}
          width={width - 64}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("weekly.earlyTraining")}</Text>
        <PieChart
          data={trainingTimeData}
          width={width - 64}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </View>

      {stats.exerciseStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("weekly.exerciseBreakdown")}</Text>
          <View style={styles.exerciseList}>
            {stats.exerciseStats.map((ex, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.exerciseStatsRow}>
                  {ex.totalSets > 0 && (
                    <Text style={styles.exerciseStat}>
                      {t("weekly.totalSets")}: {ex.totalSets}
                    </Text>
                  )}
                  {ex.totalReps > 0 && (
                    <Text style={styles.exerciseStat}>
                      {t("weekly.totalReps")}: {ex.totalReps}
                    </Text>
                  )}
                  {ex.totalTime > 0 && (
                    <Text style={styles.exerciseStat}>
                      {t("weekly.totalTime")}: {formatTime(ex.totalTime)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
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
    },
    statValue: {
      fontWeight: "600",
      color: theme.text,
    },
    exerciseList: {
      gap: 12,
    },
    exerciseItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      paddingBottom: 12,
    },
    exerciseName: {
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    exerciseStatsRow: {
      flexDirection: "column",
      gap: 4,
    },
    exerciseStat: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });
