import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
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
import {
  DailyCompletion,
  DailySnapshot,
  Exercise,
  WeeklyPlanExercise,
} from "../types";

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
    toggleRestDay,
    isRestDay,
    loadWeeklyPlan,
    mergeToDailySnapshot,
    bulkDeleteDailyExercises,
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
  const [isRestDayState, setIsRestDayState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const prevDateRef = useRef<string>("");

  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteSelectedIds, setDeleteSelectedIds] = useState<Set<number>>(
    new Set(),
  );

  const [showCopyPlanModal, setShowCopyPlanModal] = useState(false);
  const [copyPlanDay, setCopyPlanDay] = useState(0);
  const [copyPlanSelectedIds, setCopyPlanSelectedIds] = useState<Set<number>>(
    new Set(),
  );

  const DAYS = [
    t("myExercises.days.monday"),
    t("myExercises.days.tuesday"),
    t("myExercises.days.wednesday"),
    t("myExercises.days.thursday"),
    t("myExercises.days.friday"),
    t("myExercises.days.saturday"),
    t("myExercises.days.sunday"),
  ];

  useEffect(() => {
    setIsFuture(isFutureDate(date));
    const isDateChange = prevDateRef.current !== date;
    prevDateRef.current = date;
    loadData(isDateChange);
  }, [date, weeklyPlanCounter, completionCounter]);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const data = await loadDayData(date);
      let exercises = data.snapshot;

      const restDay = await isRestDay(date);
      setIsRestDayState(restDay);

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
    } catch (error) {
      console.error("Error loading day data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRestDay = async () => {
    if (!isRestDayState) {
      Alert.alert(
        t("dayDetail.restDayConfirmTitle"),
        t("dayDetail.restDayConfirmMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.confirm"),
            onPress: async () => {
              try {
                await toggleRestDay(date, isRestDayState);
                await loadData();
              } catch (error) {
                console.error("Error toggling rest day:", error);
                Alert.alert(t("common.error"), "Failed to toggle rest day");
              }
            },
          },
        ],
      );
    } else {
      try {
        await toggleRestDay(date, isRestDayState);
        await loadData();
      } catch (error) {
        console.error("Error toggling rest day:", error);
        Alert.alert(t("common.error"), "Failed to toggle rest day");
      }
    }
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
    setCompletion((prev) => ({
      ...(prev ?? { date, is_completed: false, training_time: 0 }),
      is_completed: true,
      training_time: totalSeconds,
      completed_at: dateObj.toISOString(),
    }));
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

  const toggleDeleteSelection = (id: number) => {
    setDeleteSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDeleteSelectAll = () => {
    if (deleteSelectedIds.size === snapshot.length) {
      setDeleteSelectedIds(new Set());
    } else {
      setDeleteSelectedIds(new Set(snapshot.map((e) => e.id!)));
    }
  };

  const handleStartDeleteMode = () => {
    if (snapshot.length === 0) return;
    setDeleteMode(true);
    setDeleteSelectedIds(new Set(snapshot.map((e) => e.id!)));
  };

  const handleCancelDeleteMode = () => {
    setDeleteMode(false);
    setDeleteSelectedIds(new Set());
  };

  const handleConfirmBulkDelete = () => {
    const count = deleteSelectedIds.size;
    if (count === 0) {
      Alert.alert(t("common.error"), t("dayDetail.noExercisesSelected"));
      return;
    }
    Alert.alert(
      t("dayDetail.deleteExercise"),
      t("dayDetail.bulkDeleteConfirm", { count }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await bulkDeleteDailyExercises(Array.from(deleteSelectedIds));
              setDeleteMode(false);
              setDeleteSelectedIds(new Set());
              await loadData();
            } catch (error) {
              console.error("Error bulk deleting:", error);
              Alert.alert(t("common.error"), "Failed to delete exercises.");
            }
          },
        },
      ],
    );
  };

  const handleOpenCopyPlanModal = async () => {
    await loadWeeklyPlan();
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    setCopyPlanDay(adjustedDay);
    const planExercises = weeklyPlan[adjustedDay] || [];
    setCopyPlanSelectedIds(new Set(planExercises.map((e) => e.id!)));
    setShowCopyPlanModal(true);
  };

  const handleCopyPlanDayChange = (day: number) => {
    setCopyPlanDay(day);
    const planExercises = weeklyPlan[day] || [];
    setCopyPlanSelectedIds(new Set(planExercises.map((e) => e.id!)));
  };

  const toggleCopyPlanSelection = (id: number) => {
    setCopyPlanSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCopyPlanSelectAll = () => {
    const planExercises = weeklyPlan[copyPlanDay] || [];
    if (copyPlanSelectedIds.size === planExercises.length) {
      setCopyPlanSelectedIds(new Set());
    } else {
      setCopyPlanSelectedIds(new Set(planExercises.map((e) => e.id!)));
    }
  };

  const handleConfirmCopyFromPlan = () => {
    const planExercises = weeklyPlan[copyPlanDay] || [];
    const selected = planExercises.filter((e) =>
      copyPlanSelectedIds.has(e.id!),
    );

    if (selected.length === 0) {
      Alert.alert(t("common.error"), t("dayDetail.noExercisesSelected"));
      return;
    }

    const existingNames = new Set(snapshot.map((e) => e.exercise_name));
    const duplicateNames = selected
      .filter((e) => existingNames.has(e.exercise_name))
      .map((e) => e.exercise_name);

    const nonDuplicateCount = selected.length - duplicateNames.length;
    const newTotal = snapshot.length + nonDuplicateCount;

    if (newTotal > 20) {
      Alert.alert(
        t("dayDetail.exerciseLimitTitle"),
        t("dayDetail.exerciseLimitMessage"),
      );
      return;
    }

    let message = t("dayDetail.pasteConfirmMessage", {
      count: selected.length,
    });

    if (duplicateNames.length > 0) {
      message +=
        "\n\n" +
        t("dayDetail.duplicateWarning", {
          names: duplicateNames.join(", "),
        });
    }

    Alert.alert(t("dayDetail.pasteSelected"), message, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        onPress: async () => {
          const exercisesToMerge = selected.map(
            ({ id, day_of_week, ...rest }) => rest,
          );
          await mergeToDailySnapshot(date, exercisesToMerge);
          setShowCopyPlanModal(false);
          await loadData();
        },
      },
    ]);
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

    const isSelected = deleteSelectedIds.has(item.id!);

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={deleteMode ? undefined : drag}
          onPress={
            deleteMode ? () => toggleDeleteSelection(item.id!) : undefined
          }
          disabled={isActive}
          style={[
            styles.exerciseCard,
            isActive && { opacity: 0.7 },
            deleteMode && isSelected && styles.exerciseCardSelected,
          ]}
        >
          <View style={styles.iconContainer}>
            {getIconComponent(item.icon_family, item.icon_name, theme)}
          </View>

          <View style={styles.exerciseInfo}>
            {!deleteMode && item.training_reference_url ? (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const canOpen = await Linking.canOpenURL(
                      item.training_reference_url!,
                    );
                    if (canOpen) {
                      await Linking.openURL(item.training_reference_url!);
                    } else {
                      Alert.alert("Error", "Cannot open this URL");
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to open URL");
                  }
                }}
                style={styles.exerciseNameContainer}
              >
                <Text style={[styles.exerciseName, styles.exerciseNameLink]}>
                  {item.exercise_name}
                </Text>
                <Ionicons name="open-outline" size={16} color={theme.primary} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.exerciseName}>{item.exercise_name}</Text>
            )}
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

          {deleteMode ? (
            <View style={styles.selectionIndicator}>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={isSelected ? theme.primary : theme.textSecondary}
              />
            </View>
          ) : (
            <View style={styles.exerciseActions}>
              <TouchableOpacity
                onPress={() => handleEditExercise(item)}
                style={styles.actionButton}
              >
                <Ionicons
                  name="create-outline"
                  size={24}
                  color={theme.primary}
                />
              </TouchableOpacity>
              {item.id && (
                <TouchableOpacity
                  onPress={() => handleDeleteExercise(item.id!)}
                  style={styles.actionButton}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={theme.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderDeleteToolbar = () => {
    if (!deleteMode) return null;
    return (
      <View style={styles.selectionToolbar}>
        <Text style={styles.selectedCount}>
          {deleteSelectedIds.size} / {snapshot.length} {t("dayDetail.selected")}
        </Text>
        <TouchableOpacity onPress={toggleDeleteSelectAll}>
          <Text style={styles.selectAllText}>
            {deleteSelectedIds.size === snapshot.length
              ? t("dayDetail.deselectAll")
              : t("dayDetail.selectAll")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isCompleted = completion?.is_completed || false;
  const isPast = isPastDate(date);

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: theme.text, fontSize: 16 }}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  const renderCopyPlanExerciseItem = (exercise: WeeklyPlanExercise) => {
    const isSelected = copyPlanSelectedIds.has(exercise.id!);
    const hasSets =
      exercise.sets !== null &&
      exercise.sets !== undefined &&
      exercise.reps !== null &&
      exercise.reps !== undefined &&
      exercise.sets > 0 &&
      exercise.reps > 0;
    const hasTime =
      exercise.estimated_time !== null &&
      exercise.estimated_time !== undefined &&
      exercise.estimated_time > 0;

    const formatTimeShort = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
      <TouchableOpacity
        key={exercise.id}
        style={[
          styles.copyPlanExerciseCard,
          isSelected && styles.exerciseCardSelected,
        ]}
        onPress={() => toggleCopyPlanSelection(exercise.id!)}
      >
        <View style={styles.iconContainer}>
          {getIconComponent(exercise.icon_family, exercise.icon_name, theme)}
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
          <View>
            {hasSets && (
              <Text style={styles.exerciseStats}>
                {exercise.sets} sets × {exercise.reps} reps
              </Text>
            )}
            {hasTime && (
              <Text style={styles.exerciseStats}>
                {formatTimeShort(exercise.estimated_time!)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.selectionIndicator}>
          <Ionicons
            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
            size={28}
            color={isSelected ? theme.primary : theme.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

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
            ListHeaderComponent={renderDeleteToolbar()}
          />
        ) : (
          <ExerciseList
            exercises={snapshot}
            contentContainerStyle={styles.listTodayContent}
          />
        )}

        <View style={styles.stickyButtons}>
          {deleteMode ? (
            <View style={styles.deleteButtonRow}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={handleCancelDeleteMode}
              >
                <Text style={styles.deleteCancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  deleteSelectedIds.size === 0 && styles.buttonDisabled,
                ]}
                onPress={handleConfirmBulkDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  {t("dayDetail.bulkDelete")} ({deleteSelectedIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {isPast && !isCompleted && (
                <TouchableOpacity
                  style={[
                    styles.restDayButton,
                    isRestDayState && styles.restDayButtonActive,
                  ]}
                  onPress={handleToggleRestDay}
                >
                  <Text
                    style={[
                      styles.restDayButtonText,
                      isRestDayState && styles.restDayButtonTextActive,
                    ]}
                  >
                    {isRestDayState
                      ? t("restDay.removeRestDay")
                      : t("restDay.markAsRestDay")}
                  </Text>
                </TouchableOpacity>
              )}

              {!isRestDayState && (
                <>
                  {isPast && (
                    <View style={styles.pastButtonsRow}>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                          if (snapshot.length >= 20) {
                            Alert.alert(
                              t("dayDetail.exerciseLimitTitle"),
                              t("dayDetail.exerciseLimitMessage"),
                            );
                            return;
                          }
                          setEditingExercise(null);
                          setShowEditModal(true);
                        }}
                      >
                        <Text style={styles.addButtonText}>
                          {t("dayDetail.addExercise")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.copyFromPlanButton}
                        onPress={handleOpenCopyPlanModal}
                      >
                        <Text style={styles.copyFromPlanButtonText}>
                          {t("dayDetail.copyFromPlan")}
                        </Text>
                      </TouchableOpacity>

                      {snapshot.length > 0 && (
                        <TouchableOpacity
                          style={styles.bulkDeleteButton}
                          onPress={handleStartDeleteMode}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={22}
                            color="#ffffff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
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
                        {isCompleted
                          ? t("today.markAsUndone")
                          : t("today.markAsDone")}
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
                </>
              )}
            </>
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

      <Modal visible={showCopyPlanModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.copyPlanModalContent}>
            <Text style={styles.modalTitle}>{t("dayDetail.copyFromPlan")}</Text>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.copyPlanDaysScroll}
              data={DAYS}
              renderItem={({ item: dayName, index }) => (
                <TouchableOpacity
                  style={[
                    styles.copyPlanDayButton,
                    copyPlanDay === index && styles.copyPlanDayButtonActive,
                  ]}
                  onPress={() => handleCopyPlanDayChange(index)}
                >
                  <Text
                    style={[
                      styles.copyPlanDayButtonText,
                      copyPlanDay === index &&
                        styles.copyPlanDayButtonTextActive,
                    ]}
                  >
                    {dayName}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(_item, index) => index.toString()}
            />

            {(weeklyPlan[copyPlanDay] || []).length > 0 && (
              <View style={styles.copyPlanSelectAllRow}>
                <Text style={styles.selectedCount}>
                  {copyPlanSelectedIds.size} /{" "}
                  {(weeklyPlan[copyPlanDay] || []).length}{" "}
                  {t("dayDetail.selected")}
                </Text>
                <TouchableOpacity onPress={toggleCopyPlanSelectAll}>
                  <Text style={styles.selectAllText}>
                    {copyPlanSelectedIds.size ===
                    (weeklyPlan[copyPlanDay] || []).length
                      ? t("dayDetail.deselectAll")
                      : t("dayDetail.selectAll")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.copyPlanExerciseList}>
              {(weeklyPlan[copyPlanDay] || []).length === 0 ? (
                <Text style={styles.copyPlanEmptyText}>
                  {t("dayDetail.noExercisesInPlan")}
                </Text>
              ) : (
                (weeklyPlan[copyPlanDay] || []).map((exercise) =>
                  renderCopyPlanExerciseItem(exercise),
                )
              )}
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCopyPlanModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  copyPlanSelectedIds.size === 0 && styles.buttonDisabled,
                ]}
                onPress={handleConfirmCopyFromPlan}
              >
                <Text style={styles.modalSaveText}>
                  {t("dayDetail.pasteSelected")} ({copyPlanSelectedIds.size})
                </Text>
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
      paddingBottom: 280,
    },
    listTodayContent: {
      paddingBottom: 190,
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
    exerciseCardSelected: {
      borderWidth: 2,
      borderColor: theme.primary,
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
    exerciseNameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    exerciseNameLink: {
      color: theme.primary,
      textDecorationLine: "underline",
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
    selectionIndicator: {
      padding: 4,
    },
    selectionToolbar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    selectedCount: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary,
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary,
      textDecorationLine: "underline",
    },
    pastButtonsRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    deleteButtonRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    deleteCancelButton: {
      flex: 1,
      backgroundColor: theme.borderLight,
      paddingVertical: 16,
      borderRadius: 8,
    },
    deleteCancelButtonText: {
      textAlign: "center",
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    deleteConfirmButton: {
      flex: 1,
      backgroundColor: theme.error,
      paddingVertical: 16,
      borderRadius: 8,
    },
    deleteConfirmButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.5,
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
      flex: 1,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    addButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },
    copyFromPlanButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.border,
    },
    copyFromPlanButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },
    bulkDeleteButton: {
      backgroundColor: theme.error,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
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
    copyPlanModalContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 24,
      width: "90%",
      maxHeight: "80%",
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
    restDayButton: {
      marginTop: 12,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: theme.restDayBorder,
      borderWidth: 1,
      borderColor: theme.restDayBorder,
    },
    restDayButtonActive: {
      backgroundColor: theme.restDayLight,
    },
    restDayButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    restDayButtonTextActive: {
      color: theme.text,
    },
    copyPlanDaysScroll: {
      maxHeight: 40,
      marginBottom: 12,
    },
    copyPlanDayButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      marginRight: 8,
    },
    copyPlanDayButtonActive: {
      backgroundColor: theme.primary,
    },
    copyPlanDayButtonText: {
      fontWeight: "500",
      color: theme.text,
      fontSize: 13,
    },
    copyPlanDayButtonTextActive: {
      color: "#ffffff",
    },
    copyPlanSelectAllRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    copyPlanExerciseList: {
      maxHeight: 300,
      marginBottom: 16,
    },
    copyPlanExerciseCard: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      minHeight: 60,
    },
    copyPlanEmptyText: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: "center",
      paddingVertical: 24,
    },
  });
