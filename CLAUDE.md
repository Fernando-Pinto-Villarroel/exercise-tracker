You are Claude Code, a highly skilled software engineer. Your tasks are:

1. The notifications (timer, everyday reminders, etc.) are only sent when inside the app, if I leave the app, notifications are not sent to the user for some reason. Cannot change the library used for notifications (because for development purposes I depend entirely on Expo and Expo Go, and the library I'm currently using is compatible with it, other libraries might not be), I must allow sending the notifications even if the app is not open.

2. Cuando acaba un dia (domingo -> lunes) que se supone es rest day (domingo: rest_day = true, done = false), al cambiar de dia (a lunes), el dia anterior que era rest day se desmarca como rest day y se convierte en un dia normal asi que no se respeta el rest day una vez que pasa el dia que se supone tenia que ser rest day (terminando en domingo: rest_day = false, done = false).

3. En ambas paginas `MonthlyStatisticsPage` y `WeeklyStatisticsPage` colocar/recuperar el pie chart de early training, late training, etc, de este commit antiguo que tengo (solo recuperar este pie chart de este codigo antiguo, el resto de cosas no me gustaban por eso las cambié):

```
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { DailyCompletion, DailySnapshot } from "../types";

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
      </View>
      {stats.exerciseStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("weekly.exerciseBreakdown")}</Text>
          <View style={styles.exerciseList}>
            {stats.exerciseStats.map((ex, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.exerciseStatsRow}>
                  <Text style={styles.exerciseStat}>
                    {t("weekly.totalSets")}: {ex.totalSets}
                  </Text>
                  <Text style={styles.exerciseStat}>
                    {t("weekly.totalReps")}: {ex.totalReps}
                  </Text>
                  <Text style={styles.exerciseStat}>
                    {t("weekly.totalTime")}: {formatTime(ex.totalTime)}
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
```

4. En ambas paginas `MonthlyStatisticsPage` y `WeeklyStatisticsPage` de estadisticas, que las secciones de "Exercise Statistics" ya no sea simple texo plano, sino dividir en dos columnas, ahora mostrando con cards los exercises statistics: el icono del ejercicio en la parte superior y debajo su informacion en vertical (nombre y estadisticas). Es una mejora de UX principalmente.

5. Agregar una nueva pagina de estadísticas anuales, ingresable a través de un botón nuevo debajo del botón de "View Monthly Statistics" en la página de `MonthlyScreen`. Esta pagina nueva `AnnualStatisticsPage` debe ser igual a las de `MonthlyStatisticsPage` y `WeeklyStatisticsPage`, pero cubrir el año completo para el cual se ingresa desde la `MonthlyScreen` (por ejemplo, si está abierto el calendario mensual en `Enero, 2026`, el annual statistics debe ser para 2026. otro ejemplo, si está el calendario mensual `Diciembre, 2025` se deberia abrir el annual statistics para 2025, etc.)

Crucial aspects you must take into account:

1. If you find you need to update the database schema, please update it but being careful about adding migrations support so current users can properly migrate to the new schema without bugs/errors/breaking the app. There are active users now, real people using the app, if you need to update the database schema please be careful with these users and add migrations to ensure they can safely use the new version without data corruption (not only for their current data, but also be careful of the import/export feature, maybe add versioning + migrations to it to avoid issues, etc).

2. Make sure to follow the existing theme toggle logic (light/dark) and internationalization (/en.json, /es.json) for different language users. Also make sure to check the existing code implementation to get an idea of what the aesthetics of the app is, how the app works, etc.

3. Try to reuse existing code and create reusable components to make the code as clean and scalable as possible.
