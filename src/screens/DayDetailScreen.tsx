import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseList from "../components/ExerciseList";
import ExerciseModal from "../components/ExerciseModal";
import TimePicker from "../components/TimePicker";
import { useTheme } from "../contexts/ThemeContext";
import { useExerciseStore } from "../store/exerciseStore";
import { DailyCompletion, DailySnapshot, Exercise } from "../types";

const formatTime = (totalSeconds: number) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isFutureDate = (dateStr: string): boolean => {
  const today = getTodayDate();
  return dateStr > today;
};

const isPastDate = (dateStr: string): boolean => {
  const today = getTodayDate();
  return dateStr < today;
};

export default function DayDetailScreen({ route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { date } = route.params;
  const {
    loadDayData,
    toggleDayCompletion,
    updateDayElapsedTime,
    weeklyPlan,
    weeklyPlanCounter,
    completionCounter,
    updateDailyExercise,
    saveDailyExercise,
    deleteDailyExercise,
  } = useExerciseStore();
  const [snapshot, setSnapshot] = useState<DailySnapshot[]>([]);
  const [completion, setCompletion] = useState<DailyCompletion | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");
  const [isFuture, setIsFuture] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<DailySnapshot | null>(
    null
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    setIsFuture(isFutureDate(date));
    loadData();
  }, [date, weeklyPlanCounter, completionCounter]);

  const loadData = async () => {
    const data = await loadDayData(date);
    let exercises = data.snapshot;

    if (exercises.length === 0 && isFutureDate(date)) {
      const dateObj = new Date(date + "T00:00:00");
      const dayOfWeek = dateObj.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const plan = weeklyPlan[adjustedDay] || [];
      exercises = plan.map((ex) => ({
        ...ex,
        date: date,
      }));
    }

    setSnapshot(exercises);
    setCompletion(data.completion);
  };

  const handleToggle = async () => {
    if (!completion?.is_completed) {
      setShowTimePicker(true);
    } else {
      await toggleDayCompletion(date);
      await loadData();
    }
  };

  const handleTimeConfirm = async (hours: number, minutes: number) => {
    const dateObj = new Date(date + "T00:00:00");
    dateObj.setHours(hours, minutes, 0, 0);

    await toggleDayCompletion(date, dateObj.toISOString());
    await loadData();
  };

  const handleEditTime = () => {
    if (completion) {
      const mins = Math.floor(completion.elapsed_seconds / 60);
      const secs = completion.elapsed_seconds % 60;
      setEditMinutes(mins.toString());
      setEditSeconds(secs.toString());
    } else {
      setEditMinutes("");
      setEditSeconds("");
    }
    setShowTimeModal(true);
  };

  const handleSaveTime = async () => {
    const mins = parseInt(editMinutes) || 0;
    const secs = parseInt(editSeconds) || 0;
    const totalSeconds = mins * 60 + secs;

    await updateDayElapsedTime(date, totalSeconds);
    await loadData();
    setShowTimeModal(false);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise as DailySnapshot);
    setShowEditModal(true);
  };

  const handleDeleteExercise = async (id: number) => {
    Alert.alert(t("dayDetail.deleteExercise"), t("dayDetail.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDailyExercise(id);
            await loadData();
          } catch (error) {
            console.error("Error deleting exercise:", error);
            Alert.alert(
              t("exerciseModal.error"),
              error instanceof Error
                ? error.message
                : "Failed to delete exercise."
            );
          }
        },
      },
    ]);
  };

  const handleSaveDaily = async (
    exerciseData: Omit<DailySnapshot, "id" | "date">
  ) => {
    try {
      if (editingExercise?.id) {
        await updateDailyExercise(editingExercise.id, exerciseData);
      } else {
        await saveDailyExercise(date, exerciseData);
      }
      await loadData();
    } catch (error) {
      console.error("Error saving exercise:", error);
      throw error;
    }
  };

  const isCompleted = completion?.is_completed || false;

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {snapshot.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("dayDetail.noExercises")}</Text>
          </View>
        ) : (
          <ExerciseList
            exercises={snapshot}
            onEdit={isPastDate(date) ? handleEditExercise : undefined}
            onDelete={isPastDate(date) ? handleDeleteExercise : undefined}
          />
        )}

        {isPastDate(date) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingExercise(null);
              setShowEditModal(true);
            }}
          >
            <Text style={styles.addButtonText}>
              {t("dayDetail.addExercise")}
            </Text>
          </TouchableOpacity>
        )}

        {!isFuture && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              isCompleted && styles.completeButtonDone,
            ]}
            onPress={handleToggle}
          >
            <Text style={styles.completeButtonText}>
              {isCompleted ? t("today.markAsUndone") : t("today.markAsDone")}
            </Text>
          </TouchableOpacity>
        )}

        {isCompleted && !isFuture && (
          <TouchableOpacity
            style={styles.timeEditButton}
            onPress={handleEditTime}
          >
            <Text style={styles.timeEditButtonText}>
              {t("dayDetail.editTrainingTime")}:{" "}
              {formatTime(completion?.elapsed_seconds || 0)}
            </Text>
          </TouchableOpacity>
        )}

        <Modal visible={showTimeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("dayDetail.editTime")}</Text>

              <View style={styles.modalInputRow}>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>
                    {t("dayDetail.minutes")}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editMinutes}
                    onChangeText={setEditMinutes}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>
                    {t("dayDetail.seconds")}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editSeconds}
                    onChangeText={setEditSeconds}
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
                  <Text style={styles.modalCancelText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveTime}
                >
                  <Text style={styles.modalSaveText}>{t("common.save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ExerciseModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          exercise={editingExercise}
          onSaveDaily={handleSaveDaily}
        />

        <TimePicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onConfirm={handleTimeConfirm}
          initialHours={new Date().getHours()}
          initialMinutes={new Date().getMinutes()}
        />
      </ScrollView>
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
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 18,
    },
    completeButton: {
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 12,
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
    addButton: {
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
      marginBottom: 12,
    },
    addButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    timeEditButton: {
      marginBottom: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.iconBackground,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    timeEditButtonText: {
      textAlign: "center",
      color: theme.text,
      fontSize: 14,
      fontWeight: "500",
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
