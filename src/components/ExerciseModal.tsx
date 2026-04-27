import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { useExerciseStore } from "../store/exerciseStore";
import { DailySnapshot, WeeklyPlanExercise } from "../types";
import { SvgIcon } from "./SvgIcons";

interface ExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  dayOfWeek?: number;
  exercise: WeeklyPlanExercise | DailySnapshot | null;
  onSaveDaily?: (exercise: Omit<DailySnapshot, "id" | "date">) => void;
}

const ICON_OPTIONS = [
  { type: "image", name: "gym-dumbbell", label: "Dumbbell" },
  { type: "image", name: "gym-bar", label: "Barbell" },
  { type: "image", name: "gym-hand-press", label: "Gym Hand Press" },
  { type: "image", name: "gym-rumbell", label: "Gym Rumbell" },
  { type: "image", name: "gym-station", label: "Gym Station" },
  { type: "image", name: "calisthenics-bar", label: "Calisthenics Bar" },
  { type: "image", name: "grips", label: "Grips" },
  { type: "image", name: "push-up", label: "Push Up" },
  { family: "MaterialIcons", name: "sports-gymnastics", label: "Kettlebell" },
  { family: "Ionicons", name: "walk", label: "Walk" },
  { family: "FontAwesome5", name: "running", label: "Running" },
  { family: "Ionicons", name: "body", label: "Body" },
  { family: "FontAwesome5", name: "child", label: "Plank" },
  { family: "MaterialIcons", name: "directions-bike", label: "Cycling" },
  { family: "FontAwesome5", name: "swimmer", label: "Swimming" },
  { type: "image", name: "jumping-rope", label: "Jumping Rope" },
  { family: "FontAwesome5", name: "basketball-ball", label: "Basketball" },
  { family: "FontAwesome5", name: "futbol", label: "Soccer" },
  { family: "FontAwesome5", name: "volleyball-ball", label: "Volleyball" },
  { family: "FontAwesome5", name: "table-tennis", label: "Ping Pong" },
  { family: "FontAwesome5", name: "baseball-ball", label: "Baseball" },
  { family: "FontAwesome5", name: "football-ball", label: "Football" },
  { type: "image", name: "boxing-gloves", label: "Boxing Gloves" },
  { family: "MaterialIcons", name: "self-improvement", label: "Yoga" },
  { type: "image", name: "gymnastics-hoops", label: "Gymnastics Hoops" },
  { type: "image", name: "buck", label: "Buck" },
  { family: "FontAwesome5", name: "hiking", label: "Hiking" },
  { family: "FontAwesome5", name: "skiing", label: "Skiing" },
];

type MeasurementType = "sets_reps" | "time" | "both";

const { width } = Dimensions.get("window");
const ICON_SIZE = (width - 48 - 24) / 4;

export default function ExerciseModal({
  visible,
  onClose,
  dayOfWeek,
  exercise,
  onSaveDaily,
}: ExerciseModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { saveExerciseToDay, updateExercise } = useExerciseStore();
  const [name, setName] = useState("");
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("sets_reps");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState("");
  const [estimatedTimeSeconds, setEstimatedTimeSeconds] = useState("");
  const [restTimeBetweenSetsMinutes, setRestTimeBetweenSetsMinutes] = useState("");
  const [restTimeBetweenSetsSeconds, setRestTimeBetweenSetsSeconds] = useState("");
  const [trainingReferenceUrl, setTrainingReferenceUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    if (exercise) {
      setName(exercise.exercise_name);

      const hasSetsReps =
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

      if (hasSetsReps && hasTime) {
        setMeasurementType("both");
      } else if (hasTime) {
        setMeasurementType("time");
      } else {
        setMeasurementType("sets_reps");
      }

      setSets(exercise.sets?.toString() || "");
      setReps(exercise.reps?.toString() || "");
      setTrainingReferenceUrl(exercise.training_reference_url || "");
      if (exercise.estimated_time && exercise.estimated_time > 0) {
        const totalSeconds = exercise.estimated_time;
        const minutes = Math.floor(totalSeconds / 60).toString();
        const seconds = (totalSeconds % 60).toString();
        setEstimatedTimeMinutes(minutes);
        setEstimatedTimeSeconds(seconds);
      } else {
        setEstimatedTimeMinutes("");
        setEstimatedTimeSeconds("");
      }

      if (exercise.rest_time_between_sets && exercise.rest_time_between_sets > 0) {
        const restTotal = exercise.rest_time_between_sets;
        setRestTimeBetweenSetsMinutes(Math.floor(restTotal / 60).toString());
        setRestTimeBetweenSetsSeconds((restTotal % 60).toString());
      } else {
        setRestTimeBetweenSetsMinutes("");
        setRestTimeBetweenSetsSeconds("");
      }

      const iconFamily = exercise.icon_family || "image";
      const icon = ICON_OPTIONS.find(
        (opt) =>
          (opt.type === iconFamily || opt.family === iconFamily) &&
          opt.name === exercise.icon_name
      );
      if (icon) {
        setSelectedIcon(icon);
      } else {
        setSelectedIcon(ICON_OPTIONS[0]);
      }
    } else {
      setName("");
      setMeasurementType("sets_reps");
      setSets("");
      setReps("");
      setEstimatedTimeMinutes("");
      setEstimatedTimeSeconds("");
      setRestTimeBetweenSetsMinutes("");
      setRestTimeBetweenSetsSeconds("");
      setTrainingReferenceUrl("");
      setSelectedIcon(ICON_OPTIONS[0]);
    }
  }, [exercise, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;

    if (measurementType === "sets_reps" || measurementType === "both") {
      const setsNum = parseInt(sets);
      const repsNum = parseInt(reps);
      if (
        !sets ||
        !reps ||
        setsNum <= 0 ||
        repsNum <= 0 ||
        setsNum > 999 ||
        repsNum > 999
      ) {
        Alert.alert(
          t("common.error"),
          "Please enter valid sets and reps (1-999)"
        );
        return;
      }
    }
    if (measurementType === "time" || measurementType === "both") {
      const mins = parseInt(estimatedTimeMinutes);
      const secs = parseInt(estimatedTimeSeconds);
      if (
        !estimatedTimeMinutes ||
        !estimatedTimeSeconds ||
        mins < 0 ||
        secs < 0 ||
        mins > 999 ||
        secs > 59
      ) {
        Alert.alert(
          t("common.error"),
          "Please enter valid time (minutes: 0-999, seconds: 0-59)"
        );
        return;
      }
    }

    if (
      (measurementType === "sets_reps" || measurementType === "both") &&
      (restTimeBetweenSetsMinutes || restTimeBetweenSetsSeconds)
    ) {
      const restMins = parseInt(restTimeBetweenSetsMinutes || "0");
      const restSecs = parseInt(restTimeBetweenSetsSeconds || "0");
      if (
        isNaN(restMins) ||
        isNaN(restSecs) ||
        restMins < 0 ||
        restSecs < 0 ||
        restMins > 999 ||
        restSecs > 59
      ) {
        Alert.alert(
          t("common.error"),
          "Please enter valid rest time (minutes: 0-999, seconds: 0-59)"
        );
        return;
      }
    }

    try {
      const trimmedName = name.trim();

      if (!onSaveDaily && dayOfWeek !== undefined) {
        const db = getDatabase();
        const existing = await db.getFirstAsync(
          "SELECT id FROM weekly_plan WHERE day_of_week = ? AND exercise_name = ? AND id != ?",
          [dayOfWeek, trimmedName, exercise?.id || 0]
        );
        if (existing) {
          Alert.alert(
            t("exerciseModal.error"),
            t("exerciseModal.exerciseExists")
          );
          return;
        }
      }

      const hasRestTime =
        (measurementType === "sets_reps" || measurementType === "both") &&
        (restTimeBetweenSetsMinutes || restTimeBetweenSetsSeconds);
      const restTimeTotalSeconds = hasRestTime
        ? parseInt(restTimeBetweenSetsMinutes || "0") * 60 +
          parseInt(restTimeBetweenSetsSeconds || "0")
        : undefined;

      const exerciseData = {
        exercise_name: trimmedName,
        icon_name: selectedIcon.name,
        icon_family: selectedIcon.type || selectedIcon.family || "image",
        sets:
          measurementType === "sets_reps" || measurementType === "both"
            ? parseInt(sets)
            : undefined,
        reps:
          measurementType === "sets_reps" || measurementType === "both"
            ? parseInt(reps)
            : undefined,
        estimated_time:
          measurementType === "time" || measurementType === "both"
            ? parseInt(estimatedTimeMinutes) * 60 +
              parseInt(estimatedTimeSeconds)
            : undefined,
        training_reference_url: trainingReferenceUrl.trim() || undefined,
        rest_time_between_sets:
          restTimeTotalSeconds && restTimeTotalSeconds > 0
            ? restTimeTotalSeconds
            : undefined,
        sort_order: 0,
      };

      if (onSaveDaily) {
        await onSaveDaily(exerciseData);
      } else {
        if (dayOfWeek === undefined) return;
        const weeklyData = {
          ...exerciseData,
          sort_order: 0,
        };
        if (exercise?.id) {
          await updateExercise(exercise.id, weeklyData);
        } else {
          await saveExerciseToDay(dayOfWeek, weeklyData);
        }
      }

      onClose();
    } catch (error) {
      console.error("Error saving exercise:", error);
      Alert.alert(
        t("exerciseModal.error"),
        error instanceof Error
          ? error.message
          : "Failed to save exercise. Please try again."
      );
    }
  };

  const isValid = (() => {
    if (!name.trim()) return false;

    if (measurementType === "sets_reps" || measurementType === "both") {
      if (!sets || !reps) return false;
    }
    if (measurementType === "time" || measurementType === "both") {
      if (!estimatedTimeMinutes || !estimatedTimeSeconds) return false;
    }

    return true;
  })();

  const getIconComponent = (option: (typeof ICON_OPTIONS)[0]) => {
    if (option.type === "image") {
      return <SvgIcon name={option.name} color={theme.primary} size={30} />;
    } else {
      const iconFamilies = { Ionicons, MaterialIcons, FontAwesome5 };
      const IconFamily =
        iconFamilies[option.family as keyof typeof iconFamilies];
      return (
        <IconFamily name={option.name as any} size={28} color={theme.primary} />
      );
    }
  };

  const styles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {exercise
                ? t("exerciseModal.editExercise")
                : t("exerciseModal.addExercise")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("exerciseModal.exerciseName")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("exerciseModal.exerciseNamePlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("exerciseModal.measurementType")}
              </Text>
              <View style={styles.measurementTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.measurementTypeButton,
                    measurementType === "sets_reps" &&
                      styles.measurementTypeButtonSelected,
                  ]}
                  onPress={() => setMeasurementType("sets_reps")}
                >
                  <Text
                    style={[
                      styles.measurementTypeText,
                      measurementType === "sets_reps" &&
                        styles.measurementTypeTextSelected,
                    ]}
                  >
                    {t("exerciseModal.setsReps")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.measurementTypeButton,
                    measurementType === "time" &&
                      styles.measurementTypeButtonSelected,
                  ]}
                  onPress={() => setMeasurementType("time")}
                >
                  <Text
                    style={[
                      styles.measurementTypeText,
                      measurementType === "time" &&
                        styles.measurementTypeTextSelected,
                    ]}
                  >
                    {t("exerciseModal.time")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.measurementTypeButton,
                    measurementType === "both" &&
                      styles.measurementTypeButtonSelected,
                  ]}
                  onPress={() => setMeasurementType("both")}
                >
                  <Text
                    style={[
                      styles.measurementTypeText,
                      measurementType === "both" &&
                        styles.measurementTypeTextSelected,
                    ]}
                  >
                    {t("exerciseModal.both")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {(measurementType === "sets_reps" ||
              measurementType === "both") && (
              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.label}>{t("exerciseModal.sets")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3"
                    placeholderTextColor={theme.textTertiary}
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroupHalf}>
                  <Text style={styles.label}>{t("exerciseModal.reps")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor={theme.textTertiary}
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {(measurementType === "sets_reps" || measurementType === "both") && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t("exerciseModal.restTimeBetweenSets")}
                </Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroupHalf}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM"
                      placeholderTextColor={theme.textTertiary}
                      value={restTimeBetweenSetsMinutes}
                      onChangeText={setRestTimeBetweenSetsMinutes}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text
                    style={{
                      alignSelf: "center",
                      marginHorizontal: 8,
                      color: theme.text,
                    }}
                  >
                    :
                  </Text>
                  <View style={styles.inputGroupHalf}>
                    <TextInput
                      style={styles.input}
                      placeholder="SS"
                      placeholderTextColor={theme.textTertiary}
                      value={restTimeBetweenSetsSeconds}
                      onChangeText={setRestTimeBetweenSetsSeconds}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            {(measurementType === "time" || measurementType === "both") && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t("exerciseModal.estimatedTime")}
                </Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroupHalf}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM"
                      placeholderTextColor={theme.textTertiary}
                      value={estimatedTimeMinutes}
                      onChangeText={setEstimatedTimeMinutes}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text
                    style={{
                      alignSelf: "center",
                      marginHorizontal: 8,
                      color: theme.text,
                    }}
                  >
                    :
                  </Text>
                  <View style={styles.inputGroupHalf}>
                    <TextInput
                      style={styles.input}
                      placeholder="SS"
                      placeholderTextColor={theme.textTertiary}
                      value={estimatedTimeSeconds}
                      onChangeText={setEstimatedTimeSeconds}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("exerciseModal.trainingReferenceUrl")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("exerciseModal.trainingReferenceUrlPlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={trainingReferenceUrl}
                onChangeText={setTrainingReferenceUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.iconSection}>
              <Text style={styles.label}>{t("exerciseModal.selectIcon")}</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.family || option.type}-${option.name}`}
                    style={[
                      styles.iconButton,
                      {
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                        marginRight: (index + 1) % 4 === 0 ? 0 : 8,
                        marginBottom: 8,
                      },
                      selectedIcon.name === option.name &&
                        (selectedIcon.family === option.family ||
                          selectedIcon.type === option.type) &&
                        styles.iconButtonSelected,
                    ]}
                    onPress={() => setSelectedIcon(option)}
                  >
                    {getIconComponent(option)}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.saveButtonText}>
                {exercise
                  ? t("exerciseModal.updateExercise")
                  : t("exerciseModal.addExercise")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.background,
    },
    inputRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    inputGroupHalf: {
      flex: 1,
    },
    iconSection: {
      marginBottom: 0,
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    iconButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: theme.iconBackground,
      padding: 4,
    },
    iconButtonSelected: {
      backgroundColor: theme.primaryLight,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    saveButton: {
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
      marginTop: 16,
      marginBottom: 48,
    },
    saveButtonDisabled: {
      backgroundColor: theme.buttonDisabled,
    },
    saveButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    measurementTypeContainer: {
      flexDirection: "row",
      gap: 8,
    },
    measurementTypeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.iconBackground,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    measurementTypeButtonSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    measurementTypeText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      textAlign: "center",
    },
    measurementTypeTextSelected: {
      color: theme.primary,
    },
  });
