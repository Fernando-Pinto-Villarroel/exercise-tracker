import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import ExerciseList from "../components/ExerciseList";
import ExerciseModal from "../components/ExerciseModal";
import { SvgIcon } from "../components/SvgIcons";
import TimePicker from "../components/TimePicker";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
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

const iconFamilies = {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
};

const getIconComponent = (family: string, name: string, theme: any) => {
  if (family === "image") {
    return <SvgIcon name={name} color={theme.primary} size={32} />;
  }
  const IconFamily =
    iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
  return <IconFamily name={name as any} size={32} color={theme.primary} />;
};

export default function DayDetailScreen({ route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { date } = route.params;
  const {
    loadDayData,
    toggleDayCompletion,
    updateTrainingTime,
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
    null,
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [initialHours, setInitialHours] = useState(new Date().getHours());
  const [initialMinutes, setInitialMinutes] = useState(new Date().getMinutes());
  const [showCompletionTimeModal, setShowCompletionTimeModal] = useState(false);
  const [completionMinutes, setCompletionMinutes] = useState("");
  const [completionSeconds, setCompletionSeconds] = useState("");
  const [completionHour, setCompletionHour] = useState(new Date().getHours());
  const [completionMinute, setCompletionMinute] = useState(
    new Date().getMinutes(),
  );

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
      const now = new Date();
      setInitialHours(now.getHours());
      setInitialMinutes(now.getMinutes());
      setShowTimePicker(true);
    } else {
      await toggleDayCompletion(date);
      await loadData();
    }
  };

  const handleTimeConfirm = async (hours: number, minutes: number) => {
    setCompletionHour(hours);
    setCompletionMinute(minutes);
    setCompletionMinutes("");
    setCompletionSeconds("");
    setShowCompletionTimeModal(true);
  };

  const handleCompletionTimeConfirm = async () => {
    const mins = parseInt(completionMinutes) || 0;
    const secs = parseInt(completionSeconds) || 0;

    if (mins < 0 || mins > 999) return;
    if (secs < 0 || secs > 59) return;

    const totalSeconds = mins * 60 + secs;

    const dateObj = new Date(date + "T00:00:00");
    dateObj.setHours(completionHour, completionMinute, 0, 0);

    await toggleDayCompletion(date, dateObj.toISOString());
    await updateTrainingTime(date, totalSeconds);
    await loadData();
    setShowCompletionTimeModal(false);
  };

  const handleEditTime = () => {
    if (completion) {
      const mins = Math.floor(completion.training_time / 60);
      const secs = completion.training_time % 60;
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

    if (mins < 0 || mins > 999) return;
    if (secs < 0 || secs > 59) return;

    const totalSeconds = mins * 60 + secs;

    await updateTrainingTime(date, totalSeconds);
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
                : "Failed to delete exercise.",
            );
          }
        },
      },
    ]);
  };

  const handleSaveDaily = async (
    exerciseData: Omit<DailySnapshot, "id" | "date">,
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

  const handleDragEnd = async ({ data }: { data: DailySnapshot[] }) => {
    try {
      const db = getDatabase();

      await db.runAsync("BEGIN TRANSACTION");

      for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        if (id !== undefined) {
          await db.runAsync(
            "UPDATE daily_snapshot SET sort_order = ? WHERE id = ?",
            [-(i + 1000), id],
          );
        }
      }

      for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        if (id !== undefined) {
          await db.runAsync(
            "UPDATE daily_snapshot SET sort_order = ? WHERE id = ?",
            [i, id],
          );
        }
      }

      await db.runAsync("COMMIT");
      await loadData();
    } catch (error) {
      console.error("Error reordering exercises:", error);
      try {
        const db = getDatabase();
        await db.runAsync("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
      Alert.alert(
        t("common.error"),
        "Failed to reorder exercises. Please try again.",
      );
    }
  };

  const renderDraggableItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<DailySnapshot>) => {
    const hasSets =
      item.sets !== null &&
      item.sets !== undefined &&
      item.reps !== null &&
      item.reps !== undefined &&
      item.sets > 0 &&
      item.reps > 0;

    const hasTime =
      item.estimated_time !== null &&
      item.estimated_time !== undefined &&
      item.estimated_time > 0;

    const formatTimeShort = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.exerciseCard, isActive && { opacity: 0.7 }]}
        >
          <View style={styles.iconContainer}>
            {getIconComponent(item.icon_family, item.icon_name, theme)}
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.exercise_name}</Text>
            <View>
              {hasSets && (
                <Text style={styles.exerciseStats}>
                  {item.sets} sets × {item.reps} reps
                </Text>
              )}
              {hasTime && (
                <Text style={styles.exerciseStats}>
                  {formatTimeShort(item.estimated_time!)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.exerciseActions}>
            <TouchableOpacity
              onPress={() => handleEditExercise(item)}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
            {item.id && (
              <TouchableOpacity
                onPress={() => handleDeleteExercise(item.id!)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={24} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const isCompleted = completion?.is_completed || false;
  const isPast = isPastDate(date);
  const isToday = date === getTodayDate();

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {snapshot.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("dayDetail.noExercises")}</Text>
          </View>
        ) : isPast ? (
          <DraggableFlatList
            data={snapshot}
            onDragEnd={handleDragEnd}
            keyExtractor={(item, index) => `daily-${item.id || index}`}
            renderItem={renderDraggableItem}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <ExerciseList
            exercises={snapshot}
            contentContainerStyle={styles.listTodayContent}
          />
        )}

        <View style={styles.stickyButtons}>
          {isPast && (
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
                {formatTime(completion?.training_time || 0)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("dayDetail.editTime")}</Text>

            <View style={styles.modalInputRow}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>{t("dayDetail.minutes")}</Text>
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
                <Text style={styles.modalLabel}>{t("dayDetail.seconds")}</Text>
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
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
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

      <Modal visible={showCompletionTimeModal} transparent animationType="fade">
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
                  value={completionMinutes}
                  onChangeText={setCompletionMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>{t("dayDetail.seconds")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={completionSeconds}
                  onChangeText={setCompletionSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCompletionTimeModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCompletionTimeConfirm}
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
        initialHours={initialHours}
        initialMinutes={initialMinutes}
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
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    stickyButtons: {
      position: "absolute",
      bottom: 0,
      left: 16,
      right: 16,
      backgroundColor: theme.background,
      paddingBottom: 4,
    },
    listContent: {
      paddingBottom: 240, // space for sticky buttons
    },
    listTodayContent: {
      paddingBottom: 190, // space for sticky buttons
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
    exerciseCard: {
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
      marginBottom: 12,
      minHeight: 120,
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
    exerciseActions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      padding: 4,
    },
    completeButton: {
      marginTop: 12,
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
