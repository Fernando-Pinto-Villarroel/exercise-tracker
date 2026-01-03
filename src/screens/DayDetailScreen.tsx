import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseList from "../components/ExerciseList";
import { useExerciseStore } from "../store/exerciseStore";
import { DailyCompletion, DailySnapshot } from "../types";

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

export default function DayDetailScreen({ route }: any) {
  const { date } = route.params;
  const { loadDayData, toggleDayCompletion, updateDayElapsedTime } =
    useExerciseStore();
  const [snapshot, setSnapshot] = useState<DailySnapshot[]>([]);
  const [completion, setCompletion] = useState<DailyCompletion | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    const data = await loadDayData(date);
    setSnapshot(data.snapshot);
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
          <ExerciseList exercises={snapshot} />
        )}

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

        {isCompleted && (
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
