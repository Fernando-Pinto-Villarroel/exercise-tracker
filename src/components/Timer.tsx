import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppState,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const TIMER_STORAGE_KEY = "timer_seconds";
const TIMER_START_KEY = "timer_start_time";
const TIMER_RUNNING_KEY = "timer_is_running";
const NOTIFICATION_ID = "timer-notification";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Timer({ resetTrigger }: { resetTrigger?: number }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const notificationIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setupNotifications();
    loadTimer();
    checkMidnightReset();

    // Handle app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === "active") {
      // App came to foreground - recalculate timer
      await recalculateTimer();
    }
  };

  const setupNotifications = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("timer", {
        name: "Timer",
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [],
        enableVibrate: false,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
    }
  };

  const recalculateTimer = async () => {
    const startTimeStr = await AsyncStorage.getItem(TIMER_START_KEY);
    const initialSeconds = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
    const wasRunning = await AsyncStorage.getItem(TIMER_RUNNING_KEY);

    if (wasRunning === "true" && startTimeStr && initialSeconds) {
      const startTime = parseInt(startTimeStr);
      const initial = parseInt(initialSeconds);
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, initial - elapsed);

      setRemainingSeconds(remaining);
      if (remaining > 0) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
        await stopTimer();
      }
    }
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(async () => {
        setRemainingSeconds((prev) => {
          const newSeconds = Math.max(0, prev - 1);
          if (newSeconds === 0) {
            stopTimer();
          }
          return newSeconds;
        });

        // Update notification
        if (Platform.OS === "android") {
          await updateNotification();
        }
      }, 1000);
    } else if (remainingSeconds <= 0 && isRunning) {
      setIsRunning(false);
      stopTimer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds]);

  useEffect(() => {
    const reset = async () => {
      await stopTimer();
      setRemainingSeconds(0);
      await saveTimer(0);
    };
    if (resetTrigger) reset();
  }, [resetTrigger]);

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const checkMidnightReset = async () => {
    const lastDate = await AsyncStorage.getItem("timer_last_date");
    const today = getTodayDate();

    if (lastDate !== today) {
      await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
      await AsyncStorage.setItem("timer_last_date", today);
      setRemainingSeconds(0);
    }
  };

  const loadTimer = async () => {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        setRemainingSeconds(parseInt(stored));
      }
    } catch (error) {
      console.error("Error loading timer:", error);
    }
  };

  const saveTimer = async (seconds: number) => {
    try {
      await AsyncStorage.setItem(TIMER_STORAGE_KEY, seconds.toString());
    } catch (error) {
      console.error("Error saving timer:", error);
    }
  };

  const startTimer = async () => {
    if (remainingSeconds <= 0) return;

    const startTime = Date.now();
    await AsyncStorage.setItem(TIMER_START_KEY, startTime.toString());
    await AsyncStorage.setItem(TIMER_RUNNING_KEY, "true");
    setIsRunning(true);

    if (Platform.OS === "android") {
      await showNotification();
    }
  };

  const stopTimer = async () => {
    await AsyncStorage.setItem(TIMER_RUNNING_KEY, "false");
    await AsyncStorage.removeItem(TIMER_START_KEY);
    setIsRunning(false);

    if (Platform.OS === "android") {
      await hideNotification();
    }
  };

  const showNotification = async () => {
    if (Platform.OS !== "android") return;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏱️ Timer Running",
        body: `Time remaining: ${formatTime(remainingSeconds)}`,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        sound: null,
      },
      trigger: null,
    });

    notificationIdRef.current = notificationId;
  };

  const updateNotification = async () => {
    if (Platform.OS !== "android" || !notificationIdRef.current) return;

    try {
      await Notifications.dismissNotificationAsync(notificationIdRef.current);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏱️ Timer Running",
          body: `Time remaining: ${formatTime(remainingSeconds)}`,
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          sound: null,
        },
        trigger: null,
      });
      notificationIdRef.current = notificationId;
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const hideNotification = async () => {
    if (Platform.OS !== "android") return;

    if (notificationIdRef.current) {
      await Notifications.dismissNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    await Notifications.dismissAllNotificationsAsync();
  };

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

      if (mins < 0 || mins > 999) {
        setIsSaving(false);
        return;
      }
      if (secs < 0 || secs > 59) {
        setIsSaving(false);
        return;
      }

      const wasRunning = isRunning;
      if (wasRunning) {
        await stopTimer();
      }

      const totalSeconds = mins * 60 + secs;
      setRemainingSeconds(totalSeconds);
      await saveTimer(totalSeconds);

      if (wasRunning && totalSeconds > 0) {
        // Restart timer with new time
        const startTime = Date.now();
        await AsyncStorage.setItem(TIMER_START_KEY, startTime.toString());
        await AsyncStorage.setItem(TIMER_RUNNING_KEY, "true");
        setIsRunning(true);
        if (Platform.OS === "android") {
          await showNotification();
        }
      }

      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save timer:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTimer = async () => {
    if (isRunning) {
      await stopTimer();
    } else {
      await startTimer();
    }
  };

  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.timerContainer}>
        <View style={styles.timerContent}>
          <TouchableOpacity onPress={handleToggleTimer}>
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
      bottom: 45,
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
