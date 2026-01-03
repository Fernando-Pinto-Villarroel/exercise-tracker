import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomHeader from "../components/CustomHeader";
import { getDatabase } from "../database/init";
import { useExerciseStore } from "../store/exerciseStore";
import { DailyCompletion } from "../types";
import DayDetailScreen from "./DayDetailScreen";
import WeeklyStatsScreen from "./WeeklyStatsScreen";

const Stack = createNativeStackNavigator();

function WeeklyOverview({ navigation }: any) {
  const [weekData, setWeekData] = useState<DailyCompletion[]>([]);
  const { refreshCounter } = useExerciseStore();

  useEffect(() => {
    loadWeekData();
  }, [refreshCounter]);

  const loadWeekData = async () => {
    const dates = getWeekDates();
    const db = getDatabase();

    const data: DailyCompletion[] = [];
    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );
      data.push(
        completion || { date, is_completed: false, elapsed_seconds: 0 }
      );
    }

    setWeekData(data);
  };

  const getWeekDates = () => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - timezoneOffset);
    const dayOfWeek = localDate.getDay();
    const monday = new Date(localDate);
    monday.setDate(localDate.getDate() - ((dayOfWeek + 6) % 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - timezoneOffset);
    return dateStr === localDate.toISOString().split("T")[0];
  };

  const isFutureDate = (dateStr: string) => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - timezoneOffset);
    const targetDate = new Date(dateStr + "T00:00:00");

    // Only disable dates that are strictly after today (tomorrow and beyond)
    return targetDate > localDate && !isToday(dateStr);
  };

  const formatTime = (completion: DailyCompletion) => {
    if (!completion.completed_at) return "";
    const time = new Date(completion.completed_at);
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
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
                if (!isFutureDate(day.date)) {
                  navigation.navigate("DayDetail", { date: day.date });
                }
              }}
              disabled={isFutureDate(day.date)}
            >
              <View style={styles.dayCardContent}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{getDayName(day.date)}</Text>
                  {isToday(day.date) && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Today</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dayDate}>{day.date}</Text>
                {day.completed_at && (
                  <Text style={styles.completedTime}>
                    Completed at {formatTime(day)}
                  </Text>
                )}
              </View>

              <View style={styles.dayStatus}>
                <Ionicons
                  name={
                    day.is_completed ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={32}
                  color={day.is_completed ? "#10b981" : "#d1d5db"}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate("WeeklyStats")}
        >
          <Text style={styles.statsButtonText}>View Weekly Statistics</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function WeeklyScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#3b82f6",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: "center",
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
          title: "Day Details",
          header: () => <CustomHeader title="Day Details" />,
        }}
      />
      <Stack.Screen
        name="WeeklyStats"
        component={WeeklyStatsScreen}
        options={{
          title: "Weekly Statistics",
          header: () => <CustomHeader title="Weekly Statistics" />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: "#3b82f6",
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
    color: "#111827",
    marginRight: 8,
  },
  todayBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
  dayDate: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  completedTime: {
    fontSize: 12,
    color: "#16a34a",
    marginTop: 4,
  },
  dayStatus: {
    alignItems: "center",
  },
  statsButton: {
    backgroundColor: "#2563eb",
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
