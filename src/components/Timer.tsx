import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useExerciseStore } from "../store/exerciseStore";

export default function Timer() {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

      await updateElapsedTime(totalSeconds);

      try {
        await updateTimerStartTime(totalSeconds);
      } catch (error) {
        console.error("Failed to update timer start time:", error);
      }

      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save timer:", error);
      setShowEditModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.timerContainer}>
        <View style={styles.timerContent}>
          <TouchableOpacity onPress={() => setIsRunning(!isRunning)}>
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={28}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>

          <TouchableOpacity onPress={handleEdit}>
            <Ionicons
              name="create-outline"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("timer.editTime")}</Text>

            <View style={styles.modalInputRow}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>{t("dayDetail.minutes")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editMinutes}
                  onChangeText={setEditMinutes}
                  keyboardType="numeric"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>{t("dayDetail.seconds")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editSeconds}
                  onChangeText={setEditSeconds}
                  keyboardType="numeric"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                <Text style={styles.modalSaveText}>
                  {isSaving ? t("common.saving") : t("common.save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    timerContainer: {
      position: "absolute",
      bottom: 80,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    timerContent: {
      backgroundColor: theme.card,
      borderRadius: 50,
      shadowColor: theme.shadow,
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
      color: theme.text,
      minWidth: 80,
      textAlign: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 24,
      width: 320,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.text,
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
      color: theme.textSecondary,
      marginBottom: 4,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: theme.text,
      backgroundColor: theme.background,
    },
    modalButtonRow: {
      flexDirection: "row",
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: theme.borderLight,
      borderRadius: 4,
    },
    modalCancelText: {
      textAlign: "center",
      fontWeight: "600",
      color: theme.text,
    },
    modalSaveButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    modalSaveText: {
      textAlign: "center",
      color: "#ffffff",
      fontWeight: "600",
    },
  });
