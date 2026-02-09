import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomHeader from "../components/CustomHeader";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import i18n from "../i18n";
import { useExerciseStore } from "../store/exerciseStore";
import { DailyCompletion } from "../types";
import DayDetailScreen from "./DayDetailScreen";
import MonthlyStatsScreen from "./MonthlyStatsScreen";

const Stack = createNativeStackNavigator();

function MonthlyOverview({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<Record<string, DailyCompletion>>(
    {},
  );
  const { completionCounter, isRestDay } = useExerciseStore();
  const [restDays, setRestDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMonthData();
  }, [currentMonth, completionCounter]);

  const loadMonthData = async () => {
    const dates = getMonthDates(currentMonth);
    const db = getDatabase();

    const data: Record<string, DailyCompletion> = {};
    const restDaysSet = new Set<string>();

    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date],
      );
      if (completion) {
        data[date] = completion;
      }

      // Check if this day is a rest day
      const isRest = await isRestDay(date);
      if (isRest) {
        restDaysSet.add(date);
      }
    }

    setMonthData(data);
    setRestDays(restDaysSet);
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

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
      days.push(dateStr);
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    return dateStr === todayStr;
  };

  const isFutureDate = (dateStr: string) => {
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    return dateStr > todayStr;
  };

  const monthName = currentMonth.toLocaleDateString(i18n.language, {
    month: "long",
    year: "numeric",
  });
  const calendarDays = getCalendarDays();

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={previousMonth}>
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{monthName.toString()}</Text>

            <TouchableOpacity onPress={nextMonth}>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {[
              t("myExercises.days.sunday"),
              t("myExercises.days.monday"),
              t("myExercises.days.tuesday"),
              t("myExercises.days.wednesday"),
              t("myExercises.days.thursday"),
              t("myExercises.days.friday"),
              t("myExercises.days.saturday"),
            ].map((day, index) => (
              <View key={index} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day.substring(0, 3)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <View key={`empty-${index}`} style={styles.calendarDay} />
                );
              }

              const completion = monthData[date];
              const today = isToday(date);
              const isRest = restDays.has(date);

              return (
                <TouchableOpacity
                  key={date}
                  style={styles.calendarDay}
                  onPress={() => {
                    navigation.navigate("DayDetail", { date });
                  }}
                >
                  <View
                    style={[
                      styles.dayContent,
                      today && styles.dayContentToday,
                      isFutureDate(date) && styles.dayContentDisabled,
                      isRest && styles.dayContentRestDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        today && styles.dayNumberToday,
                        isFutureDate(date) && styles.dayNumberDisabled,
                      ]}
                    >
                      {parseInt(date.split("-")[2], 10)}
                      {!!completion?.is_completed && !isRest && " ✓"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() =>
            navigation.navigate("MonthlyStats", {
              month: currentMonth.toISOString(),
            })
          }
        >
          <Text style={styles.statsButtonText}>
            {t("monthly.viewMonthlyStats")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function MonthlyScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: "center",
        contentStyle: {
          backgroundColor: theme.background,
        },
        animation: "none",
        presentation: "card",
      }}
    >
      <Stack.Screen
        name="MonthlyOverview"
        component={MonthlyOverview}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{
          title: t("dayDetail.title"),
          header: () => <CustomHeader title={t("dayDetail.title")} />,
        }}
      />
      <Stack.Screen
        name="MonthlyStats"
        component={MonthlyStatsScreen}
        options={{
          title: t("monthly.monthlyOverview"),
          header: () => <CustomHeader title={t("monthly.monthlyOverview")} />,
        }}
      />
    </Stack.Navigator>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
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
    monthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    monthTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    weekDaysRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      alignItems: "center",
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    calendarDay: {
      width: "14.28%",
      aspectRatio: 1,
      padding: 4,
    },
    dayContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      backgroundColor: theme.background,
    },
    dayContentToday: {
      backgroundColor: theme.primaryLight,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    dayContentDisabled: {
      backgroundColor: theme.background,
      opacity: 0.6,
    },
    dayNumber: {
      fontSize: 14,
      color: theme.text,
    },
    dayNumberDisabled: {
      color: theme.textTertiary,
    },
    dayNumberToday: {
      fontSize: 13,
      fontWeight: "bold",
      color: theme.primary,
    },
    statsButton: {
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    statsButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    dayContentRestDay: {
      backgroundColor: theme.restDayLight,
    },
  });
