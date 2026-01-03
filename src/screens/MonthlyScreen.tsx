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
import MonthlyStatsScreen from "./MonthlyStatsScreen";

const Stack = createNativeStackNavigator();

function MonthlyOverview({ navigation }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<Record<string, DailyCompletion>>(
    {}
  );
  const { refreshCounter } = useExerciseStore();

  useEffect(() => {
    loadMonthData();
  }, [currentMonth, refreshCounter]);

  const loadMonthData = async () => {
    const dates = getMonthDates(currentMonth);
    const db = getDatabase();

    const data: Record<string, DailyCompletion> = {};
    for (const date of dates) {
      const completion = await db.getFirstAsync<DailyCompletion>(
        "SELECT * FROM daily_completion WHERE date = ?",
        [date]
      );
      if (completion) {
        data[date] = completion;
      }
    }

    setMonthData(data);
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const dates = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      dates.push(d.toISOString().split("T")[0]);
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
      days.push(date.toISOString().split("T")[0]);
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
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

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const calendarDays = getCalendarDays();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={previousMonth}>
              <Ionicons name="chevron-back" size={24} color="#3b82f6" />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{monthName.toString()}</Text>

            <TouchableOpacity onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day.toString()}</Text>
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

              return (
                <TouchableOpacity
                  key={date}
                  style={styles.calendarDay}
                  onPress={() => {
                    if (!isFutureDate(date)) {
                      navigation.navigate("DayDetail", { date });
                    }
                  }}
                  disabled={isFutureDate(date)}
                >
                  <View
                    style={[
                      styles.dayContent,
                      today && styles.dayContentToday,
                      isFutureDate(date) && styles.dayContentDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        today && styles.dayNumberToday,
                        isFutureDate(date) && styles.dayNumberDisabled,
                      ]}
                    >
                      {new Date(date + "T00:00:00").getDate()}
                      {completion?.is_completed ? " ✓" : ""}
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
          <Text style={styles.statsButtonText}>View Monthly Statistics</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function MonthlyScreen() {
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
        name="MonthlyOverview"
        component={MonthlyOverview}
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
        name="MonthlyStats"
        component={MonthlyStatsScreen}
        options={{
          title: "Monthly Statistics",
          header: () => <CustomHeader title="Monthly Statistics" />,
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
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
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
    color: "#6b7280",
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
    backgroundColor: "#f9fafb",
  },
  dayContentToday: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  dayContentDisabled: {
    backgroundColor: "#f3f4f6",
    opacity: 0.6,
  },
  dayNumber: {
    fontSize: 14,
    color: "#111827",
  },
  dayNumberDisabled: {
    color: "#9ca3af",
  },
  dayNumberToday: {
    fontWeight: "bold",
    color: "#2563eb",
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
