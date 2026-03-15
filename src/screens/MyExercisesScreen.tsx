import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import ExerciseModal from "../components/ExerciseModal";
import { SvgIcon } from "../components/SvgIcons";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { useExerciseStore } from "../store/exerciseStore";
import { Exercise, WeeklyPlanExercise } from "../types";

const iconFamilies = {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
};

const getIconComponent = (family: string, name: string, color: string) => {
  if (family === "image") {
    return <SvgIcon name={name} color={color} size={32} />;
  }
  const IconFamily =
    iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
  return <IconFamily name={name as any} size={32} color={color} />;
};

export default function MyExercisesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    weeklyPlan,
    loadWeeklyPlan,
    deleteExercise,
    mergeExercisesToDay,
    bulkDeleteWeeklyExercises,
    toggleWeeklyRestDay,
    loadWeeklyRestDays,
  } = useExerciseStore();
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<WeeklyPlanExercise | null>(null);
  const [weeklyRestDays, setWeeklyRestDays] = useState<number[]>([]);

  const [selectionMode, setSelectionMode] = useState<"copy" | "delete" | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [copiedExercises, setCopiedExercises] = useState<WeeklyPlanExercise[]>(
    [],
  );
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);

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
    loadWeeklyPlan();
    loadRestDays();
  }, []);

  useEffect(() => {
    setSelectionMode(null);
    setSelectedIds(new Set());
  }, [selectedDay]);

  const loadRestDays = async () => {
    const restDays = await loadWeeklyRestDays();
    setWeeklyRestDays(restDays);
  };

  const handleRestDayToggle = async () => {
    const isCurrentlyRestDay = weeklyRestDays.includes(selectedDay);

    if (!isCurrentlyRestDay) {
      Alert.alert(
        t("myExercises.restDayConfirmTitle"),
        t("myExercises.restDayConfirmMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.confirm"),
            onPress: async () => {
              try {
                await toggleWeeklyRestDay(selectedDay);
                await loadRestDays();
                await loadWeeklyPlan();
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
        await toggleWeeklyRestDay(selectedDay);
        await loadRestDays();
        await loadWeeklyPlan();
      } catch (error) {
        console.error("Error toggling rest day:", error);
        Alert.alert(t("common.error"), "Failed to toggle rest day");
      }
    }
  };

  const MAX_EXERCISES_PER_DAY = 20;

  const handleAddExercise = () => {
    const exercises = weeklyPlan[selectedDay] || [];
    if (exercises.length >= MAX_EXERCISES_PER_DAY) {
      Alert.alert(
        t("myExercises.exerciseLimitTitle"),
        t("myExercises.exerciseLimitMessage"),
      );
      return;
    }
    setEditingExercise(null);
    setShowModal(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise as WeeklyPlanExercise);
    setShowModal(true);
  };

  const handleDeleteExercise = (id: number) => {
    Alert.alert(
      t("myExercises.deleteExercise"),
      t("myExercises.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExercise(id, selectedDay);
            } catch (error) {
              console.error("Error deleting exercise:", error);
              Alert.alert(t("common.error"), t("myExercises.deleteError"));
            }
          },
        },
      ],
    );
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === exercises.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(exercises.map((e) => e.id!)));
    }
  };

  const handleStartCopy = () => {
    if (exercises.length === 0) return;
    setSelectionMode("copy");
    setSelectedIds(new Set(exercises.map((e) => e.id!)));
  };

  const handleConfirmCopy = () => {
    const selected = exercises.filter((e) => selectedIds.has(e.id!));
    if (selected.length === 0) {
      Alert.alert(t("common.error"), t("myExercises.noExercisesSelected"));
      return;
    }
    setCopiedExercises(selected);
    setCopyFromDay(selectedDay);
    setSelectionMode(null);
    setSelectedIds(new Set());
    Alert.alert(t("myExercises.copyMode"), t("myExercises.selectDestination"));
  };

  const handleCancelCopy = () => {
    setCopiedExercises([]);
    setCopyFromDay(null);
  };

  const handlePaste = () => {
    const targetExercises = weeklyPlan[selectedDay] || [];
    const targetNames = new Set(targetExercises.map((e) => e.exercise_name));
    const duplicateNames = copiedExercises
      .filter((e) => targetNames.has(e.exercise_name))
      .map((e) => e.exercise_name);

    const nonDuplicateCount = copiedExercises.length - duplicateNames.length;
    const newTotal = targetExercises.length + nonDuplicateCount;

    if (newTotal > MAX_EXERCISES_PER_DAY) {
      Alert.alert(
        t("myExercises.exerciseLimitTitle"),
        t("myExercises.exerciseLimitMessage"),
      );
      return;
    }

    let message = t("myExercises.pasteConfirmMessage", {
      count: copiedExercises.length,
      day: DAYS[selectedDay],
    });

    if (duplicateNames.length > 0) {
      message +=
        "\n\n" +
        t("myExercises.duplicateWarning", {
          names: duplicateNames.join(", "),
        });
    }

    Alert.alert(t("myExercises.pastePlan"), message, [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("myExercises.paste"),
        onPress: async () => {
          const exercisesToMerge = copiedExercises.map(
            ({ id, day_of_week, ...rest }) => rest,
          );
          await mergeExercisesToDay(exercisesToMerge, selectedDay);
          setCopiedExercises([]);
          setCopyFromDay(null);
        },
      },
    ]);
  };

  const handleStartBulkDelete = () => {
    if (exercises.length === 0) return;
    setSelectionMode("delete");
    setSelectedIds(new Set(exercises.map((e) => e.id!)));
  };

  const handleConfirmBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) {
      Alert.alert(t("common.error"), t("myExercises.noExercisesSelected"));
      return;
    }
    Alert.alert(
      t("myExercises.deleteExercise"),
      t("myExercises.bulkDeleteConfirm", { count }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await bulkDeleteWeeklyExercises(
                Array.from(selectedIds),
                selectedDay,
              );
              setSelectionMode(null);
              setSelectedIds(new Set());
            } catch (error) {
              console.error("Error bulk deleting:", error);
              Alert.alert(t("common.error"), t("myExercises.deleteError"));
            }
          },
        },
      ],
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(null);
    setSelectedIds(new Set());
  };

  const handleDragEnd = async ({ data }: { data: WeeklyPlanExercise[] }) => {
    try {
      const db = getDatabase();

      await db.runAsync("BEGIN TRANSACTION");

      for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        if (id !== undefined) {
          await db.runAsync(
            "UPDATE weekly_plan SET sort_order = ? WHERE id = ?",
            [-(i + 1000), id],
          );
        }
      }

      for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        if (id !== undefined) {
          await db.runAsync(
            "UPDATE weekly_plan SET sort_order = ? WHERE id = ?",
            [i, id],
          );
        }
      }

      await db.runAsync("COMMIT");
      await loadWeeklyPlan();
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

  const renderExerciseItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<WeeklyPlanExercise>) => {
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

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const isSelected = selectedIds.has(item.id!);

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={selectionMode ? undefined : drag}
          onPress={selectionMode ? () => toggleSelection(item.id!) : undefined}
          disabled={isActive}
          style={[
            styles.exerciseCard,
            isActive && { opacity: 0.7 },
            selectionMode && isSelected && styles.exerciseCardSelected,
          ]}
        >
          <View style={styles.iconContainer}>
            {getIconComponent(item.icon_family, item.icon_name, theme.primary)}
          </View>

          <View style={styles.exerciseInfo}>
            {!selectionMode && item.training_reference_url ? (
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
                  {formatTime(item.estimated_time!)}
                </Text>
              )}
            </View>
          </View>

          {selectionMode ? (
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

  const exercises = weeklyPlan[selectedDay] || [];
  const isSelectedDayRestDay = weeklyRestDays.includes(selectedDay);
  const hasCopiedExercises =
    copiedExercises.length > 0 && copyFromDay !== selectedDay;

  const styles = createStyles(theme);

  const renderRestDayToggle = () => (
    <View style={styles.restDayToggleContainer}>
      <View style={styles.restDayLabelContainer}>
        <Text style={styles.restDayLabel}>{t("restDay.validRestDay")}</Text>
        <Text style={styles.restDaySubLabel}>{t("restDay.restDayInfo")}</Text>
      </View>
      <Switch
        value={isSelectedDayRestDay}
        onValueChange={handleRestDayToggle}
        trackColor={{ false: theme.borderLight, true: theme.primary }}
        thumbColor={
          isSelectedDayRestDay ? theme.primaryLight : theme.textSecondary
        }
      />
    </View>
  );

  const renderSelectionToolbar = () => {
    if (!selectionMode) return null;
    return (
      <View style={styles.selectionToolbar}>
        <Text style={styles.selectedCount}>
          {selectedIds.size} / {exercises.length} {t("myExercises.selected")}
        </Text>
        <TouchableOpacity onPress={toggleSelectAll}>
          <Text style={styles.selectAllText}>
            {selectedIds.size === exercises.length
              ? t("myExercises.deselectAll")
              : t("myExercises.selectAll")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCopyBanner = () => {
    if (!copiedExercises.length || selectionMode) return null;
    return (
      <View style={styles.copyBanner}>
        <Text style={styles.copyBannerText}>
          {t("myExercises.copiedFrom", {
            count: copiedExercises.length,
            day: DAYS[copyFromDay!],
          })}
        </Text>
        <TouchableOpacity onPress={handleCancelCopy}>
          <Ionicons name="close-circle" size={22} color={theme.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderButtons = () => {
    if (selectionMode === "copy") {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSelection}
          >
            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addButton,
              selectedIds.size === 0 && styles.buttonDisabled,
            ]}
            onPress={handleConfirmCopy}
          >
            <Text style={styles.addButtonText}>
              {t("myExercises.copySelected")} ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectionMode === "delete") {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSelection}
          >
            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteActionButton,
              selectedIds.size === 0 && styles.buttonDisabled,
            ]}
            onPress={handleConfirmBulkDelete}
          >
            <Text style={styles.addButtonText}>
              {t("myExercises.bulkDelete")} ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
          <Text style={styles.addButtonText}>
            {t("myExercises.addExercise")}
          </Text>
        </TouchableOpacity>
        {hasCopiedExercises ? (
          <TouchableOpacity
            style={[styles.copyButton, styles.copyButtonActive]}
            onPress={handlePaste}
          >
            <Text style={styles.copyButtonText}>
              {t("myExercises.pasteHere")}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.copyButton} onPress={handleStartCopy}>
            <Text style={styles.copyButtonText}>{t("myExercises.copy")}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.bulkDeleteButton}
          onPress={handleStartBulkDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScrollView}
        data={DAYS}
        initialScrollIndex={selectedDay}
        getItemLayout={(_data, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === index && styles.dayButtonTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(_item, index) => index.toString()}
      />

      <View style={styles.content}>
        {isSelectedDayRestDay ? (
          <>
            {renderRestDayToggle()}
            <View style={styles.restDayMessage}>
              <Ionicons name="moon" size={48} color={theme.primary} />
              <Text style={styles.restDayMessageText}>
                {t("restDay.weeklyRestDayActive", { day: DAYS[selectedDay] })}
              </Text>
            </View>
          </>
        ) : exercises.length === 0 ? (
          <>
            {renderRestDayToggle()}
            {renderCopyBanner()}
            <View style={styles.emptyContainer}>
              <Ionicons
                name="barbell-outline"
                size={64}
                color={theme.textTertiary}
              />
              <Text style={styles.emptyText}>
                {t("myExercises.noExercises")}
              </Text>
              <Text style={styles.emptySubtext}>
                {t("myExercises.addExercisesHint")}
              </Text>
            </View>
          </>
        ) : (
          <DraggableFlatList
            data={exercises}
            onDragEnd={handleDragEnd}
            keyExtractor={(item, index) => `exercise-${item.id || index}`}
            renderItem={renderExerciseItem}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                {renderRestDayToggle()}
                {renderCopyBanner()}
                {renderSelectionToolbar()}
              </>
            }
          />
        )}
      </View>

      {!isSelectedDayRestDay && (
        <View style={styles.fixedButtonContainer}>{renderButtons()}</View>
      )}

      <ExerciseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        dayOfWeek={selectedDay}
        exercise={editingExercise}
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
    daysScrollView: {
      maxHeight: 48,
      marginLeft: 4,
      marginRight: 4,
      marginTop: 8,
    },
    dayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    dayButtonActive: {
      backgroundColor: theme.primary,
    },
    dayButtonText: {
      fontWeight: "500",
      color: theme.text,
      textAlign: "center",
    },
    dayButtonTextActive: {
      color: "#ffffff",
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 100,
    },
    listContent: {
      paddingBottom: 16,
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
    copyBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    copyBannerText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.primary,
      flex: 1,
      marginRight: 8,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    addButton: {
      flex: 1,
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 8,
    },
    addButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },
    copyButton: {
      flex: 1,
      backgroundColor: theme.border,
      paddingVertical: 16,
      borderRadius: 8,
    },
    copyButtonActive: {
      backgroundColor: theme.success,
    },
    copyButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
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
    cancelButton: {
      flex: 1,
      backgroundColor: theme.borderLight,
      paddingVertical: 16,
      borderRadius: 8,
    },
    cancelButtonText: {
      textAlign: "center",
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    deleteActionButton: {
      flex: 1,
      backgroundColor: theme.error,
      paddingVertical: 16,
      borderRadius: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    restDayToggleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    restDayLabelContainer: {
      flex: 1,
      marginRight: 12,
    },
    restDayLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    restDaySubLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    restDayMessage: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    restDayMessageText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
    },
    fixedButtonContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingBottom: 4,
      paddingTop: 12,
    },
  });
