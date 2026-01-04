import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseList from "../components/ExerciseList";
import Timer from "../components/Timer";
import { useTheme } from "../contexts/ThemeContext";
import { useExerciseStore } from "../store/exerciseStore";

export default function TodayScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    todaySnapshot,
    todayCompletion,
    loadTodayData,
    createTodaySnapshot,
    toggleTodayCompletion,
    weeklyPlanCounter,
    loadWeeklyPlan,
  } = useExerciseStore();

  useFocusEffect(
    React.useCallback(() => {
      initializeToday();
    }, [weeklyPlanCounter])
  );

  const initializeToday = async () => {
    await loadWeeklyPlan();
    await createTodaySnapshot();
  };

  const handleToggleCompletion = async () => {
    await toggleTodayCompletion();
  };

  const isCompleted = todayCompletion?.is_completed || false;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {todaySnapshot.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="fitness-outline"
              size={64}
              color={theme.textTertiary}
            />
            <Text style={styles.emptyText}>{t("today.noExercises")}</Text>
            <Text style={styles.emptySubtext}>
              {t("today.addExercisesHint")}
            </Text>
          </View>
        ) : (
          <ExerciseList exercises={todaySnapshot} />
        )}

        <TouchableOpacity
          style={[
            styles.completeButton,
            isCompleted && styles.completeButtonDone,
          ]}
          onPress={handleToggleCompletion}
        >
          <Text style={styles.completeButtonText}>
            {isCompleted ? t("today.markAsUndone") : t("today.markAsDone")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Timer />
    </View>
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
      paddingBottom: 128,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 18,
      marginTop: 16,
    },
    emptySubtext: {
      color: theme.textTertiary,
      fontSize: 14,
      marginTop: 8,
    },
    completeButton: {
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    completeButtonDone: {
      backgroundColor: theme.success,
    },
    completeButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
