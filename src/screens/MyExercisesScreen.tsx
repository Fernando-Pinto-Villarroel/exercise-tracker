import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseModal from "../components/ExerciseModal";
import { SvgIcon } from "../components/SvgIcons";
import { useExerciseStore } from "../store/exerciseStore";
import { WeeklyPlanExercise } from "../types";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const iconFamilies = {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
};

const getIconComponent = (family: string, name: string) => {
  if (family === "image") {
    return <SvgIcon name={name} color="#3b82f6" size={32} />;
  }
  const IconFamily =
    iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
  return <IconFamily name={name as any} size={32} color="#3b82f6" />;
};

export default function MyExercisesScreen() {
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

  useEffect(() => {
    loadWeeklyPlan();
  }, []);

  const handleAddExercise = () => {
    setEditingExercise(null);
    setShowModal(true);
  };

  const handleEditExercise = (exercise: WeeklyPlanExercise) => {
    setEditingExercise(exercise);
    setShowModal(true);
  };

  const handleDeleteExercise = (id: number) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteExercise(id, selectedDay),
        },
      ]
    );
  };

  const handleCopyDay = () => {
    if (copyFromDay === null) {
      setCopyFromDay(selectedDay);
      Alert.alert(
        "Copy Mode",
        `Selected ${DAYS[selectedDay]} to copy. Now select the destination day.`
      );
    } else {
      Alert.alert(
        "Paste Plan",
        `Copy plan from ${DAYS[copyFromDay]} to ${DAYS[selectedDay]}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setCopyFromDay(null),
          },
          {
            text: "Paste",
            onPress: async () => {
              await copyDayPlan(copyFromDay, selectedDay);
              setCopyFromDay(null);
            },
          },
        ]
      );
    }
  };

  const exercises = weeklyPlan[selectedDay] || [];

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScrollView}
        data={DAYS}
        initialScrollIndex={selectedDay}
        getItemLayout={(data, index) => ({
          length: 95, // approximate width
          offset: 95 * index,
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No exercises yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the &quot;Add Exercise&quot; button to add exercises
            </Text>
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.iconContainer}>
                  {getIconComponent(exercise.icon_family, exercise.icon_name)}
                </View>

                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>
                    {exercise.exercise_name}
                  </Text>
                  <Text style={styles.exerciseStats}>
                    {exercise.sets} sets × {exercise.reps} reps
                  </Text>
                </View>

                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    onPress={() => handleEditExercise(exercise)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={24} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(exercise.id!)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddExercise}
          >
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.copyButton,
              copyFromDay !== null && styles.copyButtonActive,
            ]}
            onPress={handleCopyDay}
          >
            <Text style={styles.copyButtonText}>
              {copyFromDay !== null ? "Paste Here" : "Copy Day"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ExerciseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        dayOfWeek={selectedDay}
        exercise={editingExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  daysScrollView: {
    maxHeight: 48,
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonActive: {
    backgroundColor: "#2563eb",
  },
  dayButtonText: {
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  dayButtonTextActive: {
    color: "#ffffff",
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
    color: "#6b7280",
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 8,
  },
  exercisesList: {
    gap: 12,
    marginBottom: 16,
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#2563eb",
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
    backgroundColor: "#6b7280",
    paddingVertical: 16,
    borderRadius: 8,
  },
  copyButtonActive: {
    backgroundColor: "#16a34a",
  },
  copyButtonText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
