import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import MonthlyScreen from "../screens/MonthlyScreen";
import MyExercisesScreen from "../screens/MyExercisesScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TodayScreen from "../screens/TodayScreen";
import WeeklyScreen from "../screens/WeeklyScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: "#3b82f6" },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        sceneStyle: {
          backgroundColor: theme.background,
        },
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today" size={size} color={color} />
          ),
          title: t("tabs.today"),
        }}
      />
      <Tab.Screen
        name="Weekly"
        component={WeeklyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          title: t("tabs.weekly"),
        }}
      />
      <Tab.Screen
        name="Monthly"
        component={MonthlyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          title: t("tabs.monthly"),
        }}
      />
      <Tab.Screen
        name="My Exercises"
        component={MyExercisesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness" size={size} color={color} />
          ),
          title: t("tabs.myExercises"),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          title: t("tabs.settings"),
        }}
      />
    </Tab.Navigator>
  );
}
