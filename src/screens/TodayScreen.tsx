import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RestSetTimer from "../components/RestSetTimer";
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

type ActionType =
  | { type: "incrementSets"; exerciseName: string; maxSets: number }
  | { type: "decrementSets"; exerciseName: string }
  | { type: "incrementTime"; exerciseName: string; maxTime: number }
  | { type: "decrementTime"; exerciseName: string };

export default function TodayScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    todaySnapshot,
    todayCompletion,
    createTodaySnapshot,
    toggleTodayCompletion,
    weeklyPlanCounter,
    loadWeeklyPlan,
    updateTrainingTime,
    isRestDay,
  } = useExerciseStore();

  const [progress, setProgress] = useState<ExerciseProgress>({});

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressInterval = useRef<NodeJS.Timeout | null>(null);
  const repetitionCount = useRef(0);

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (pressInterval.current) clearInterval(pressInterval.current);
    };
  }, []);

  const getSpeed = (count: number): number => {
    if (count >= 15) return 25;
    if (count >= 10) return 50;
    if (count >= 5) return 100;
    return 180;
  };

  const shouldExecuteAction = (action: ActionType): boolean => {
    switch (action.type) {
      case "incrementSets":
        return (
          (progress[action.exerciseName]?.currentSets || 0) < action.maxSets
        );
      case "decrementSets":
        return (progress[action.exerciseName]?.currentSets || 0) > 0;
      case "incrementTime":
        return (
          (progress[action.exerciseName]?.currentTime || 0) < action.maxTime
        );
      case "decrementTime":
        return (progress[action.exerciseName]?.currentTime || 0) > 0;
      default:
        return true;
    }
  };

  const executeAction = (action: ActionType) => {
    if (!shouldExecuteAction(action)) {
      if (pressInterval.current) {
        clearInterval(pressInterval.current);
        pressInterval.current = null;
      }
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      repetitionCount.current = 0;
      return;
    }

    switch (action.type) {
      case "incrementSets":
        incrementSets(action.exerciseName, action.maxSets);
        break;
      case "decrementSets":
        decrementSets(action.exerciseName);
        break;
      case "incrementTime":
        incrementTime(action.exerciseName, action.maxTime);
        break;
      case "decrementTime":
        decrementTime(action.exerciseName);
        break;
    }
  };

  const handlePressIn = (action: ActionType) => {
    executeAction(action);
    repetitionCount.current = 0;

    pressTimer.current = setTimeout(() => {
      repetitionCount.current = 1;

      const startRepeating = () => {
        if (pressInterval.current) clearInterval(pressInterval.current);

        const speed = getSpeed(repetitionCount.current);
        pressInterval.current = setInterval(() => {
          executeAction(action);
          repetitionCount.current++;

          const newSpeed = getSpeed(repetitionCount.current);
          if (newSpeed !== speed) {
            startRepeating();
          }
        }, speed);
      };

      startRepeating();
    }, 300);
  };

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (pressInterval.current) {
      clearInterval(pressInterval.current);
      pressInterval.current = null;
    }
    repetitionCount.current = 0;
  };
  const [todayDate, setTodayDate] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");
  const [completionHour, setCompletionHour] = useState(new Date().getHours());
  const [completionMinute, setCompletionMinute] = useState(
    new Date().getMinutes(),
  );
  const [timerResetTrigger, setTimerResetTrigger] = useState(0);
  const [isTodayRestDay, setIsTodayRestDay] = useState(false);

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(now.getDate()).padStart(2, "0")}`;
  };

  useFocusEffect(
    React.useCallback(() => {
      initializeToday();
    }, [weeklyPlanCounter]),
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
    const today = getTodayDate();
    const restDay = await isRestDay(today);
    setIsTodayRestDay(restDay);

    if (!restDay) {
      await loadWeeklyPlan();
      await createTodaySnapshot();
    }
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
        JSON.stringify(newProgress),
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
      const now = new Date();
      setCompletionHour(now.getHours());
      setCompletionMinute(now.getMinutes());
      setShowTimePicker(true);
    } else {
      await toggleTodayCompletion();
    }
  };

  const handleTimePickerConfirm = async (hours: number, minutes: number) => {
    setCompletionHour(hours);
    setCompletionMinute(minutes);
    setTimeMinutes("");
    setTimeSeconds("");
    setShowTimeModal(true);
  };

  const handleFinalConfirm = async () => {
    const mins = parseInt(timeMinutes) || 0;
    const secs = parseInt(timeSeconds) || 0;

    if (mins < 0 || mins > 999) return;
    if (secs < 0 || secs > 59) return;

    const totalSeconds = mins * 60 + secs;

    const completionTime = new Date();
    completionTime.setHours(completionHour, completionMinute, 0, 0);

    await toggleTodayCompletion(completionTime.toISOString());
    await updateTrainingTime(todayDate, totalSeconds);
    await resetProgress();
    setTimerResetTrigger((prev) => prev + 1);
    setShowTimeModal(false);
  };

  const incrementSets = (exerciseName: string, maxSets: number) => {
    setProgress((prevProgress) => {
      const current = prevProgress[exerciseName]?.currentSets || 0;
      if (current < maxSets) {
        const newProgress = {
          ...prevProgress,
          [exerciseName]: {
            ...prevProgress[exerciseName],
            currentSets: current + 1,
            currentTime: prevProgress[exerciseName]?.currentTime || 0,
          },
        };
        saveProgress(newProgress);
        return newProgress;
      }
      return prevProgress;
    });
  };

  const decrementSets = (exerciseName: string) => {
    setProgress((prevProgress) => {
      const current = prevProgress[exerciseName]?.currentSets || 0;
      if (current > 0) {
        const newProgress = {
          ...prevProgress,
          [exerciseName]: {
            ...prevProgress[exerciseName],
            currentSets: current - 1,
            currentTime: prevProgress[exerciseName]?.currentTime || 0,
          },
        };
        saveProgress(newProgress);
        return newProgress;
      }
      return prevProgress;
    });
  };

  const incrementTime = (exerciseName: string, maxTime: number) => {
    setProgress((prevProgress) => {
      const current = prevProgress[exerciseName]?.currentTime || 0;
      if (current < maxTime) {
        const increment = 30;
        const newValue = Math.min(current + increment, maxTime);
        const newProgress = {
          ...prevProgress,
          [exerciseName]: {
            ...prevProgress[exerciseName],
            currentTime: newValue,
            currentSets: prevProgress[exerciseName]?.currentSets || 0,
          },
        };
        saveProgress(newProgress);
        return newProgress;
      }
      return prevProgress;
    });
  };

  const decrementTime = (exerciseName: string) => {
    setProgress((prevProgress) => {
      const current = prevProgress[exerciseName]?.currentTime || 0;
      if (current > 0) {
        const decrement = 30;
        const newValue = Math.max(current - decrement, 0);
        const newProgress = {
          ...prevProgress,
          [exerciseName]: {
            ...prevProgress[exerciseName],
            currentTime: newValue,
            currentSets: prevProgress[exerciseName]?.currentSets || 0,
          },
        };
        saveProgress(newProgress);
        return newProgress;
      }
      return prevProgress;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open URL");
    }
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
        {isTodayRestDay ? (
          <View style={styles.restDayContainer}>
            <Ionicons name="moon" size={80} color={theme.primary} />
            <Text style={styles.restDayTitle}>{t("today.restDayTitle")}</Text>
            <Text style={styles.restDayMessage}>
              {t("today.restDayMessage")}
            </Text>
          </View>
        ) : todaySnapshot.length === 0 ? (
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
                        exercise.icon_name,
                      )}
                    </View>
                    <View style={styles.exerciseInfo}>
                      {exercise.training_reference_url ? (
                        <TouchableOpacity
                          onPress={() =>
                            handleOpenUrl(exercise.training_reference_url!)
                          }
                          style={styles.exerciseNameContainer}
                        >
                          <Text
                            style={[
                              styles.exerciseName,
                              styles.exerciseNameLink,
                            ]}
                          >
                            {exercise.exercise_name}
                          </Text>
                          <Ionicons
                            name="open-outline"
                            size={16}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.exerciseName}>
                          {exercise.exercise_name}
                        </Text>
                      )}
                      <View>
                        {hasSets && (
                          <Text style={styles.exerciseStats}>
                            {exercise.sets} sets × {exercise.reps} reps
                          </Text>
                        )}
                        {hasTime && (
                          <Text style={styles.exerciseStats}>
                            {formatTime(exercise.estimated_time!)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {exercise.sets && exercise.sets > 0 && exercise.rest_time_between_sets && exercise.rest_time_between_sets > 0 && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressLabel}>
                        {t("today.restTimer")}
                      </Text>
                      <RestSetTimer restTimeSeconds={exercise.rest_time_between_sets} />
                    </View>
                  )}

                  {hasSets && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressLabel}>
                        {t("today.setProgress")}
                      </Text>
                      <View style={styles.counterContainer}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPressIn={() =>
                            handlePressIn({
                              type: "decrementSets",
                              exerciseName: exercise.exercise_name,
                            })
                          }
                          onPressOut={handlePressOut}
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
                          onPressIn={() =>
                            handlePressIn({
                              type: "incrementSets",
                              exerciseName: exercise.exercise_name,
                              maxSets: exercise.sets!,
                            })
                          }
                          onPressOut={handlePressOut}
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
                          onPressIn={() =>
                            handlePressIn({
                              type: "decrementTime",
                              exerciseName: exercise.exercise_name,
                            })
                          }
                          onPressOut={handlePressOut}
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
                          onPressIn={() =>
                            handlePressIn({
                              type: "incrementTime",
                              exerciseName: exercise.exercise_name,
                              maxTime: exercise.estimated_time!,
                            })
                          }
                          onPressOut={handlePressOut}
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

        {!isTodayRestDay && (
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
        )}
      </ScrollView>
      {!isTodayRestDay && <Timer resetTrigger={timerResetTrigger} />}

      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimePickerConfirm}
        initialHours={completionHour}
        initialMinutes={completionMinute}
      />

      <Modal visible={showTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("dayDetail.editTrainingTime")}
            </Text>

            <View style={styles.modalInputRow}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>{t("dayDetail.minutes")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={timeMinutes}
                  onChangeText={setTimeMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>{t("dayDetail.seconds")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={timeSeconds}
                  onChangeText={setTimeSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleFinalConfirm}
              >
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    restDayContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
      paddingHorizontal: 32,
    },
    restDayTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 24,
      textAlign: "center",
    },
    restDayMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 16,
      textAlign: "center",
      lineHeight: 24,
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
      minHeight: 120,
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
      marginTop: 2,
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
    exerciseNameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    exerciseNameLink: {
      color: theme.primary,
      textDecorationLine: "underline",
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
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 24,
      width: 320,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.text,
    },
    modalInputRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    modalInputGroup: {
      flex: 1,
    },
    modalLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: theme.text,
      backgroundColor: theme.background,
    },
    modalButtonRow: {
      flexDirection: "row",
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: theme.borderLight,
      borderRadius: 4,
    },
    modalCancelText: {
      textAlign: "center",
      fontWeight: "600",
      color: theme.text,
    },
    modalSaveButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    modalSaveText: {
      textAlign: "center",
      color: "#ffffff",
      fontWeight: "600",
    },
  });
