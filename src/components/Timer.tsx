import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useExerciseStore } from "../store/exerciseStore";

export default function Timer() {
  const { todayCompletion, updateElapsedTime, updateTimerStartTime } =
    useExerciseStore();
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [originalSeconds, setOriginalSeconds] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (todayCompletion) {
      setRemainingSeconds(todayCompletion.elapsed_seconds);
      setOriginalSeconds(todayCompletion.elapsed_seconds);
    }
  }, [todayCompletion]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newSeconds = prev - 1;
          updateElapsedTime(newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else if (remainingSeconds <= 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

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

  const handleEdit = () => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    setEditMinutes(mins.toString());
    setEditSeconds(secs.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const mins = parseInt(editMinutes) || 0;
      const secs = parseInt(editSeconds) || 0;
      const totalSeconds = mins * 60 + secs;
      setRemainingSeconds(totalSeconds);
      setOriginalSeconds(totalSeconds);

      // Update elapsed time first
      await updateElapsedTime(totalSeconds);

      // Update timer start time (this might fail if column doesn't exist yet)
      try {
        await updateTimerStartTime(totalSeconds);
      } catch (error) {
        console.error("Failed to update timer start time:", error);
        // Don't let this prevent the modal from closing
      }

      // Close modal on success
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save timer:", error);
      // Ensure modal closes even if there's an error
      setShowEditModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <View style={styles.timerContainer}>
        <View style={styles.timerContent}>
          <TouchableOpacity onPress={() => setIsRunning(!isRunning)}>
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={28}
              color="#3b82f6"
            />
          </TouchableOpacity>

          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>

          <TouchableOpacity onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Time</Text>

            <View style={styles.modalInputRow}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Minutes</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editMinutes}
                  onChangeText={setEditMinutes}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Seconds</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editSeconds}
                  onChangeText={setEditSeconds}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                <Text style={styles.modalSaveText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  timerContent: {
    backgroundColor: "#ffffff",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    minWidth: 80,
    textAlign: "center",
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
