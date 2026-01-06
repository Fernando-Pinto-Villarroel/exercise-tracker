import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  StyleSheet,
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
  const { weeklyPlan, loadWeeklyPlan, deleteExercise, copyDayPlan } =
    useExerciseStore();
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<WeeklyPlanExercise | null>(null);
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
  }, []);

  const handleAddExercise = () => {
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
      ]
    );
  };

  const handleCopyDay = () => {
    if (copyFromDay === null) {
      setCopyFromDay(selectedDay);
      Alert.alert(
        t("myExercises.copyMode"),
        t("myExercises.copyModeMessage", { day: DAYS[selectedDay] })
      );
    } else {
      Alert.alert(
        t("myExercises.pastePlan"),
        t("myExercises.pastePlanMessage", {
          fromDay: DAYS[copyFromDay],
          toDay: DAYS[selectedDay],
        }),
        [
          {
            text: t("common.cancel"),
            style: "cancel",
            onPress: () => setCopyFromDay(null),
          },
          {
            text: t("myExercises.paste"),
            onPress: async () => {
              await copyDayPlan(copyFromDay, selectedDay);
              setCopyFromDay(null);
            },
          },
        ]
      );
    }
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
            [-(i + 1000), id]
          );
        }
      }

      for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        if (id !== undefined) {
          await db.runAsync(
            "UPDATE weekly_plan SET sort_order = ? WHERE id = ?",
            [i, id]
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
        "Failed to reorder exercises. Please try again."
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

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.exerciseCard, isActive && { opacity: 0.7 }]}
        >
          <View style={styles.iconContainer}>
            {getIconComponent(item.icon_family, item.icon_name, theme.primary)}
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
                  {formatTime(item.estimated_time!)}
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

  const exercises = weeklyPlan[selectedDay] || [];

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScrollView}
        data={DAYS}
        initialScrollIndex={selectedDay}
        getItemLayout={(data, index) => ({
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
        keyExtractor={(item, index) => index.toString()}
      />

      <View style={styles.content}>
        {exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="barbell-outline"
              size={64}
              color={theme.textTertiary}
            />
            <Text style={styles.emptyText}>{t("myExercises.noExercises")}</Text>
            <Text style={styles.emptySubtext}>
              {t("myExercises.addExercisesHint")}
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={exercises}
            onDragEnd={handleDragEnd}
            keyExtractor={(item, index) => `exercise-${item.id || index}`}
            renderItem={renderExerciseItem}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={[styles.buttonRow, { marginTop: 16 }]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddExercise}
          >
            <Text style={styles.addButtonText}>
              {t("myExercises.addExercise")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.copyButton,
              copyFromDay !== null && styles.copyButtonActive,
            ]}
            onPress={handleCopyDay}
          >
            <Text style={styles.copyButtonText}>
              {copyFromDay !== null
                ? t("myExercises.pasteHere")
                : t("myExercises.copyDay")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
      fontSize: 16,
      fontWeight: "600",
    },
    copyButton: {
      flex: 1,
      backgroundColor: theme.textSecondary,
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
  });
