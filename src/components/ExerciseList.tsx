import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Exercise } from "../types";
import { SvgIcon } from "./SvgIcons";

interface ExerciseListProps {
  exercises: Exercise[];
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (id: number) => void;
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

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {exercises.map((exercise, index) => (
        <View key={index} style={styles.exerciseCard}>
          <View style={styles.iconContainer}>
            {getIconComponent(exercise.icon_family, exercise.icon_name)}
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
            <Text style={styles.exerciseStats}>
              {(() => {
                // Check if we have meaningful data for each field
                const sets =
                  exercise.sets && exercise.sets > 0 ? exercise.sets : null;
                const reps =
                  exercise.reps && exercise.reps > 0 ? exercise.reps : null;
                const time =
                  exercise.estimated_time && exercise.estimated_time > 0
                    ? exercise.estimated_time
                    : null;

                if (sets && reps && time) {
                  const minutes = Math.floor(time / 60);
                  const seconds = time % 60;
                  return `${sets} sets × ${reps} reps • ${minutes}m ${seconds}s`;
                } else if (sets && reps) {
                  return `${sets} sets × ${reps} reps`;
                } else if (time) {
                  const minutes = Math.floor(time / 60);
                  const seconds = time % 60;
                  return minutes > 0
                    ? `${minutes}m ${seconds}s`
                    : `${seconds}s`;
                } else if (sets) {
                  return `${sets} sets`;
                } else if (reps) {
                  return `${reps} reps`;
                } else {
                  return "";
                }
              })()}
            </Text>
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
      ))}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 12,
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
    },
    exerciseStats: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    exerciseActions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      padding: 4,
    },
  });
