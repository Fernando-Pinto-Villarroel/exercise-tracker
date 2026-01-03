import React, { useEffect, useState } from "react";
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
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - timezoneOffset);
  return localDate.toISOString().split("T")[0];
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

  useEffect(() => {
    setIsFuture(isFutureDate(date));
    loadData();
  }, [date, weeklyPlanCounter, completionCounter]);

  const loadData = async () => {
    const data = await loadDayData(date);
    let exercises = data.snapshot;

    // If no snapshot exists and it's a future date, load the planned exercises
    if (exercises.length === 0 && isFutureDate(date)) {
      const dateObj = new Date(date + "T00:00:00");
      const dayOfWeek = dateObj.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
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
    await toggleDayCompletion(date);
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
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDailyExercise(id);
              await loadData();
            } catch (error) {
              console.error("Error deleting exercise:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete exercise."
              );
            }
          },
        },
      ]
    );
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
      throw error; // Let the modal handle it
    }
  };

  const isCompleted = completion?.is_completed || false;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {snapshot.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises for this day</Text>
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
            <Text style={styles.addButtonText}>Add Exercise</Text>
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
              {isCompleted ? "Mark as Undone" : "Mark as Done"}
            </Text>
          </TouchableOpacity>
        )}

        {isCompleted && !isFuture && (
          <TouchableOpacity
            style={styles.timeEditButton}
            onPress={handleEditTime}
          >
            <Text style={styles.timeEditButtonText}>
              Edit Training Time: {formatTime(completion?.elapsed_seconds || 0)}
            </Text>
          </TouchableOpacity>
        )}

        <Modal visible={showTimeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Training Time</Text>

              <View style={styles.modalInputRow}>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Minutes</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editMinutes}
                    onChangeText={setEditMinutes}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Seconds</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editSeconds}
                    onChangeText={setEditSeconds}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowTimeModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveTime}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  },
  completeButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#2563eb",
  },
  completeButtonDone: {
    backgroundColor: "#16a34a",
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
    backgroundColor: "#2563eb",
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
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeEditButtonText: {
    textAlign: "center",
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 24,
    width: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
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
    color: "#6b7280",
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  modalCancelText: {
    textAlign: "center",
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 4,
  },
  modalSaveText: {
    textAlign: "center",
    color: "#ffffff",
    fontWeight: "600",
  },
});
