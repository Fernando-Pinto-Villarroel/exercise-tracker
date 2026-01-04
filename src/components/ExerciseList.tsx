import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const getIconComponent = (family: string, name: string) => {
    if (family === "image") {
      return <SvgIcon name={name} color="#3b82f6" size={32} />;
    }
    const IconFamily =
      iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
    return <IconFamily name={name as any} size={32} color="#3b82f6" />;
  };

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
                const parts = [];
                if (
                  exercise.sets !== undefined &&
                  exercise.reps !== undefined
                ) {
                  parts.push(`${exercise.sets} sets × ${exercise.reps} reps`);
                }
                if (exercise.estimated_time !== undefined) {
                  const minutes = Math.floor(exercise.estimated_time / 60);
                  const seconds = exercise.estimated_time % 60;
                  const timeStr =
                    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                  parts.push(timeStr);
                }
                return parts.join(" • ");
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
                  <Ionicons name="create-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
              )}
              {onDelete && exercise.id && (
                <TouchableOpacity
                  onPress={() => onDelete(exercise.id!)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
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
    color: "#111827",
  },
  exerciseStats: {
    fontSize: 14,
    color: "#6b7280",
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
