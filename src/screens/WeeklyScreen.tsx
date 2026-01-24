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
import WeeklyStatsScreen from "./WeeklyStatsScreen";

const Stack = createNativeStackNavigator();

function WeeklyOverview({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [weekData, setWeekData] = useState<DailyCompletion[]>([]);
  const [currentMonday, setCurrentMonday] = useState("");
  const { weeklyPlanCounter, completionCounter } = useExerciseStore();

  useEffect(() => {
    loadWeekData();
  }, [weeklyPlanCounter, completionCounter]);

  useEffect(() => {
    const checkWeek = () => {
      const dates = getWeekDates();
      const monday = dates[0];
      if (monday !== currentMonday) {
        setCurrentMonday(monday);
        loadWeekData();
      }
    };

    const interval = setInterval(checkWeek, 60000);
    return () => clearInterval(interval);
  }, [currentMonday]);

  const loadWeekData = async () => {
    const dates = getWeekDates();
    const db = getDatabase();

    const data: DailyCompletion[] = [];
    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date],
      );
      data.push(completion || { date, is_completed: false, training_time: 0 });
    }

    setWeekData(data);
    setCurrentMonday(dates[0]);
  };

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
      dates.push(dateStr);
    }
    return dates;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(i18n.language, { weekday: "short" });
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

  const formatTime = (completion: DailyCompletion) => {
    if (!completion.completed_at) return "";
    const time = new Date(completion.completed_at);
    return time.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.daysList}>
          {weekData.map((day) => (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCard,
                isToday(day.date) && styles.dayCardToday,
                isFutureDate(day.date) && styles.dayCardDisabled,
              ]}
              onPress={() => {
                navigation.navigate("DayDetail", { date: day.date });
              }}
            >
              <View style={styles.dayCardContent}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{getDayName(day.date)}</Text>
                  {isToday(day.date) && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>
                        {t("weekly.today")}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dayDate}>{day.date}</Text>
                {day.completed_at && (
                  <Text style={styles.completedTime}>
                    {t("weekly.completedAt")} {formatTime(day)}
                  </Text>
                )}
              </View>

              <View style={styles.dayStatus}>
                <Ionicons
                  name={
                    day.is_completed ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={32}
                  color={day.is_completed ? theme.successLight : theme.border}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate("WeeklyStats")}
        >
          <Text style={styles.statsButtonText}>
            {t("weekly.viewWeeklyStats")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function WeeklyScreen() {
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
        name="WeeklyOverview"
        component={WeeklyOverview}
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
        name="WeeklyStats"
        component={WeeklyStatsScreen}
        options={{
          title: t("weekly.weeklyOverview"),
          header: () => <CustomHeader title={t("weekly.weeklyOverview")} />,
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
    daysList: {
      gap: 12,
      marginBottom: 16,
    },
    dayCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    dayCardToday: {
      borderWidth: 2,
      borderColor: theme.primary,
    },
    dayCardDisabled: {
      opacity: 0.6,
    },
    dayCardContent: {
      flex: 1,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    dayName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginRight: 8,
    },
    todayBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    todayBadgeText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: "500",
    },
    dayDate: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    completedTime: {
      fontSize: 12,
      color: theme.success,
      marginTop: 4,
    },
    dayStatus: {
      alignItems: "center",
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
  });
