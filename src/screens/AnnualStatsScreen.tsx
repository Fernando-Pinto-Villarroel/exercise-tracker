import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart, ProgressChart } from "react-native-chart-kit";
import ExerciseStatsGrid, {
  ExerciseStatItem,
} from "../components/ExerciseStatsGrid";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { useExerciseStore } from "../store/exerciseStore";
import { DailyCompletion, DailySnapshot } from "../types";

const { width } = Dimensions.get("window");

export default function AnnualStatsScreen({ route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { year } = route.params;
  const { completionCounter, isRestDay } = useExerciseStore();
  const [stats, setStats] = useState<{
    daysCompleted: number;
    totalDays: number;
    restDaysCount: number;
    totalTime: number;
    longestStreak: number;
    currentStreak: number;
    earlyTraining: number;
    lateTraining: number;
    noTraining: number;
    exerciseStats: ExerciseStatItem[];
    monthlyCompletions: number[];
  }>({
    daysCompleted: 0,
    totalDays: 0,
    restDaysCount: 0,
    totalTime: 0,
    longestStreak: 0,
    currentStreak: 0,
    earlyTraining: 0,
    lateTraining: 0,
    noTraining: 0,
    exerciseStats: [],
    monthlyCompletions: Array(12).fill(0),
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [year, completionCounter]),
  );

  const loadStats = async () => {
    const db = getDatabase();

    let completed = 0;
    let totalTime = 0;
    let restDaysCount = 0;
    let totalDays = 0;
    let early = 0;
    let late = 0;
    let noTraining = 0;
    const exerciseMap = new Map<string, ExerciseStatItem>();

    const allCompletions: boolean[] = [];
    const allRestDays: boolean[] = [];
    const monthlyCompletions: number[] = Array(12).fill(0);

    for (let month = 0; month < 12; month++) {
      const dates = getMonthDates(year, month);
      totalDays += dates.length;

      for (const date of dates) {
        const isRest = await isRestDay(date);
        allRestDays.push(isRest);

        if (isRest) {
          restDaysCount++;
          allCompletions.push(false);
          continue;
        }

        const completion = await db.getFirstAsync<DailyCompletion>(
          "SELECT * FROM daily_completion WHERE date = ?",
          [date],
        );

        if (completion?.is_completed) {
          completed++;
          totalTime += completion.training_time;
          allCompletions.push(true);
          monthlyCompletions[month]++;

          if (completion.completed_at) {
            const hour = new Date(completion.completed_at).getHours();
            if (hour < 12) {
              early++;
            } else {
              late++;
            }
          }

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
                  iconName: ex.icon_name,
                  iconFamily: ex.icon_family,
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
          allCompletions.push(false);
          noTraining++;
        }
      }
    }

    const streaks = calculateStreaks(allCompletions, allRestDays);

    setStats({
      daysCompleted: completed,
      totalDays,
      restDaysCount,
      totalTime,
      longestStreak: streaks.longest,
      currentStreak: streaks.current,
      earlyTraining: early,
      lateTraining: late,
      noTraining,
      exerciseStats: Array.from(exerciseMap.values()),
      monthlyCompletions,
    });
  };

  const getMonthDates = (year: number, month: number) => {
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

  const calculateStreaks = (completions: boolean[], restDays: boolean[]) => {
    const today = new Date();
    const todayIndex =
      today.getFullYear() === year
        ? getDayOfYear(today) - 1
        : completions.length - 1;

    let longest = 0;
    let current = 0;
    let temp = 0;

    for (let i = 0; i < completions.length; i++) {
      if (restDays[i]) {
        continue;
      } else if (completions[i]) {
        temp++;
        if (temp > longest) longest = temp;
      } else {
        temp = 0;
      }
    }

    for (let i = Math.min(todayIndex, completions.length - 1); i >= 0; i--) {
      if (restDays[i]) {
        continue;
      } else if (completions[i]) {
        current++;
      } else {
        break;
      }
    }

    return { longest, current };
  };

  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const workingDays = stats.totalDays - stats.restDaysCount;
  const completionRate = workingDays > 0 ? stats.daysCompleted / workingDays : 0;

  const progressData = {
    labels: [t("monthly.completionRate")],
    data: [completionRate],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity: number = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => theme.text,
    strokeWidth: 2,
    propsForLabels: {
      fontSize: 9,
    },
  };

  const hasMonthlyData = stats.monthlyCompletions.some((val) => val > 0);

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyData = {
    labels: monthLabels,
    datasets: [
      {
        data: hasMonthlyData
          ? stats.monthlyCompletions
          : [...Array(11).fill(0), 0.1],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const totalTrainingDays =
    stats.earlyTraining + stats.lateTraining + stats.noTraining;
  const hasPieData = totalTrainingDays > 0;

  const pieData = [
    {
      name: t("stats.earlyTraining"),
      count: stats.earlyTraining,
      color: "#22c55e",
      legendFontColor: theme.text,
      legendFontSize: 13,
    },
    {
      name: t("stats.lateTraining"),
      count: stats.lateTraining,
      color: "#f59e0b",
      legendFontColor: theme.text,
      legendFontSize: 13,
    },
    {
      name: t("stats.noTraining"),
      count: stats.noTraining,
      color: "#ef4444",
      legendFontColor: theme.text,
      legendFontSize: 13,
    },
  ];

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t("annual.annualOverview")} - {year}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.daysCompleted")}</Text>
            <Text style={styles.statValue}>
              {stats.daysCompleted} / {workingDays}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("monthly.completionRate")}</Text>
            <Text style={styles.statValue}>
              {Math.round(completionRate * 100)}%
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

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.earlyTraining")}</Text>
            <Text style={styles.statValue}>{stats.earlyTraining}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.lateTraining")}</Text>
            <Text style={styles.statValue}>{stats.lateTraining}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("weekly.noTraining")}</Text>
            <Text style={styles.statValue}>{stats.noTraining}</Text>
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

      {hasPieData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("stats.trainingDistribution")}
          </Text>
          <PieChart
            data={pieData}
            width={width - 64}
            height={200}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t("annual.monthlyCompletions")}
        </Text>
        {hasMonthlyData ? (
          <LineChart
            data={monthlyData}
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
          <ExerciseStatsGrid
            exercises={stats.exerciseStats}
            formatTime={formatTime}
          />
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
