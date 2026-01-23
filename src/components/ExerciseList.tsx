import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Exercise } from "../types";
import { SvgIcon } from "./SvgIcons";

interface ExerciseListProps {
  exercises: Exercise[];
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (id: number) => void;
  contentContainerStyle?: any;
}

const iconFamilies = {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
};

export default function ExerciseList({
  exercises,
  onEdit,
  onDelete,
  contentContainerStyle,
}: ExerciseListProps) {
  const { theme } = useTheme();

  const getIconComponent = (family: string, name: string) => {
    if (family === "image") {
      return <SvgIcon name={name} color={theme.primary} size={32} />;
    }
    const IconFamily =
      iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
    return <IconFamily name={name as any} size={32} color={theme.primary} />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const styles = createStyles(theme);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, contentContainerStyle]}
    >
      {exercises.map((exercise, index) => {
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

        return (
          <View key={index} style={styles.exerciseCard}>
            <View style={styles.iconContainer}>
              {getIconComponent(exercise.icon_family, exercise.icon_name)}
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
                    {formatTime(exercise.estimated_time!)}
                  </Text>
                )}
              </View>
            </View>

            {(onEdit || onDelete) && (
              <View style={styles.exerciseActions}>
                {onEdit && (
                  <TouchableOpacity
                    onPress={() => onEdit(exercise)}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name="create-outline"
                      size={24}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
                {onDelete && exercise.id && (
                  <TouchableOpacity
                    onPress={() => onDelete(exercise.id!)}
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
          </View>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 12,
      paddingBottom: 16,
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
  });
