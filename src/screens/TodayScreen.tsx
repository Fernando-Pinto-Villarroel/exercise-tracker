import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgIcon } from "../components/SvgIcons";
import TimePicker from "../components/TimePicker";
import Timer from "../components/Timer";
import { useTheme } from "../contexts/ThemeContext";
import { useExerciseStore } from "../store/exerciseStore";
import { DailySnapshot } from "../types";

interface ExerciseProgress {
  [exerciseName: string]: {
    currentSets: number;
    currentTime: number;
  };
}

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

  const [progress, setProgress] = useState<ExerciseProgress>({});
  const [todayDate, setTodayDate] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  };

  useFocusEffect(
    React.useCallback(() => {
      initializeToday();
    }, [weeklyPlanCounter])
  );

  useEffect(() => {
    const today = getTodayDate();
    setTodayDate(today);
    loadProgress(today);

    const interval = setInterval(() => {
      const newToday = getTodayDate();
      if (newToday !== today) {
        setTodayDate(newToday);
        resetProgress();
        initializeToday();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const initializeToday = async () => {
    await loadWeeklyPlan();
    await createTodaySnapshot();
  };

  const loadProgress = async (date: string) => {
    try {
      const stored = await AsyncStorage.getItem(`progress_${date}`);
      if (stored) {
        setProgress(JSON.parse(stored));
      } else {
        setProgress({});
      }
    } catch (error) {
      console.error("Error loading progress:", error);
      setProgress({});
    }
  };

  const saveProgress = async (newProgress: ExerciseProgress) => {
    try {
      await AsyncStorage.setItem(
        `progress_${todayDate}`,
        JSON.stringify(newProgress)
      );
      setProgress(newProgress);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const resetProgress = async () => {
    setProgress({});
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter((key) => key.startsWith("progress_"));
      await AsyncStorage.multiRemove(progressKeys);
    } catch (error) {
      console.error("Error resetting progress:", error);
    }
  };

  const handleToggleCompletion = async () => {
    if (!todayCompletion?.is_completed) {
      setShowTimePicker(true);
    } else {
      await toggleTodayCompletion();
    }
  };

  const handleTimeConfirm = async (hours: number, minutes: number) => {
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);

    await toggleTodayCompletion(now.toISOString());
    await resetProgress();
  };

  const incrementSets = (exerciseName: string, maxSets: number) => {
    const current = progress[exerciseName]?.currentSets || 0;
    if (current < maxSets) {
      const newProgress = {
        ...progress,
        [exerciseName]: {
          ...progress[exerciseName],
          currentSets: current + 1,
          currentTime: progress[exerciseName]?.currentTime || 0,
        },
      };
      saveProgress(newProgress);
    }
  };

  const decrementSets = (exerciseName: string) => {
    const current = progress[exerciseName]?.currentSets || 0;
    if (current > 0) {
      const newProgress = {
        ...progress,
        [exerciseName]: {
          ...progress[exerciseName],
          currentSets: current - 1,
          currentTime: progress[exerciseName]?.currentTime || 0,
        },
      };
      saveProgress(newProgress);
    }
  };

  const incrementTime = (exerciseName: string, maxTime: number) => {
    const current = progress[exerciseName]?.currentTime || 0;
    if (current < maxTime) {
      const increment = 30;
      const newValue = Math.min(current + increment, maxTime);
      const newProgress = {
        ...progress,
        [exerciseName]: {
          ...progress[exerciseName],
          currentTime: newValue,
          currentSets: progress[exerciseName]?.currentSets || 0,
        },
      };
      saveProgress(newProgress);
    }
  };

  const decrementTime = (exerciseName: string) => {
    const current = progress[exerciseName]?.currentTime || 0;
    if (current > 0) {
      const decrement = 30;
      const newValue = Math.max(current - decrement, 0);
      const newProgress = {
        ...progress,
        [exerciseName]: {
          ...progress[exerciseName],
          currentTime: newValue,
          currentSets: progress[exerciseName]?.currentSets || 0,
        },
      };
      saveProgress(newProgress);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const iconFamilies = {
    Ionicons,
    MaterialIcons,
    FontAwesome5,
  };

  const getIconComponent = (family: string, name: string) => {
    if (family === "image") {
      return <SvgIcon name={name} color={theme.primary} size={32} />;
    }
    const IconFamily =
      iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
    return <IconFamily name={name as any} size={32} color={theme.primary} />;
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
          <View style={styles.exercisesContainer}>
            {todaySnapshot.map((exercise: DailySnapshot) => {
              const exerciseId = exercise.id!;
              const hasSets = exercise.sets && exercise.sets > 0;
              const hasTime =
                exercise.estimated_time && exercise.estimated_time > 0;
              const currentSets =
                progress[exercise.exercise_name]?.currentSets || 0;
              const currentTime =
                progress[exercise.exercise_name]?.currentTime || 0;

              return (
                <View key={exerciseId} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.iconContainer}>
                      {getIconComponent(
                        exercise.icon_family,
                        exercise.icon_name
                      )}
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {exercise.exercise_name}
                      </Text>
                      <Text style={styles.exerciseStats}>
                        {hasSets &&
                          `${exercise.sets} sets × ${exercise.reps} reps`}
                        {hasSets && hasTime && " • "}
                        {hasTime && formatTime(exercise.estimated_time!)}
                      </Text>
                    </View>
                  </View>

                  {hasSets && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressLabel}>
                        {t("today.setProgress")}
                      </Text>
                      <View style={styles.counterContainer}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => decrementSets(exercise.exercise_name)}
                        >
                          <Ionicons
                            name="remove-circle"
                            size={32}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.counterText}>
                          {currentSets} / {exercise.sets}
                        </Text>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() =>
                            incrementSets(
                              exercise.exercise_name,
                              exercise.sets!
                            )
                          }
                        >
                          <Ionicons
                            name="add-circle"
                            size={32}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {hasTime && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressLabel}>
                        {t("today.timeProgress")}
                      </Text>
                      <View style={styles.counterContainer}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => decrementTime(exercise.exercise_name)}
                        >
                          <Ionicons
                            name="remove-circle"
                            size={32}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.counterText}>
                          {formatTime(currentTime)} /{" "}
                          {formatTime(exercise.estimated_time!)}
                        </Text>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() =>
                            incrementTime(
                              exercise.exercise_name,
                              exercise.estimated_time!
                            )
                          }
                        >
                          <Ionicons
                            name="add-circle"
                            size={32}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
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

      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
        initialHours={new Date().getHours()}
        initialMinutes={new Date().getMinutes()}
      />
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
    exercisesContainer: {
      gap: 16,
    },
    exerciseCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    exerciseStats: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    iconContainer: {
      width: 48,
      height: 48,
      backgroundColor: theme.iconBackground,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    exerciseInfo: {
      flex: 1,
    },
    progressContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: 8,
    },
    counterContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    counterButton: {
      padding: 4,
    },
    counterText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      minWidth: 100,
      textAlign: "center",
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
