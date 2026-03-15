import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hours: number, minutes: number) => void;
  initialHours?: number;
  initialMinutes?: number;
  minTime?: { hours: number; minutes: number };
  maxTime?: { hours: number; minutes: number };
  title?: string;
}

type ActionType =
  | "incrementHours"
  | "decrementHours"
  | "incrementMinutes"
  | "decrementMinutes";

export default function TimePicker({
  visible,
  onClose,
  onConfirm,
  initialHours = new Date().getHours(),
  initialMinutes = new Date().getMinutes(),
  minTime,
  maxTime,
  title,
}: TimePickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);

  const hoursRef = useRef(initialHours);
  const minutesRef = useRef(initialMinutes);
  const minTimeRef = useRef(minTime);
  const maxTimeRef = useRef(maxTime);

  useEffect(() => { hoursRef.current = hours; }, [hours]);
  useEffect(() => { minutesRef.current = minutes; }, [minutes]);
  useEffect(() => { minTimeRef.current = minTime; }, [minTime]);
  useEffect(() => { maxTimeRef.current = maxTime; }, [maxTime]);

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressInterval = useRef<NodeJS.Timeout | null>(null);
  const repetitionCount = useRef(0);

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (pressInterval.current) clearInterval(pressInterval.current);
    };
  }, []);

  const executeAction = (action: ActionType) => {
    const h = hoursRef.current;
    const m = minutesRef.current;
    let newH = h;
    let newM = m;

    switch (action) {
      case "incrementHours":
        newH = (h + 1) % 24;
        break;
      case "decrementHours":
        newH = (h - 1 + 24) % 24;
        break;
      case "incrementMinutes":
        newM = (m + 1) % 60;
        break;
      case "decrementMinutes":
        newM = (m - 1 + 60) % 60;
        break;
    }

    const total = newH * 60 + newM;
    const min = minTimeRef.current;
    const max = maxTimeRef.current;
    if (min && total < min.hours * 60 + min.minutes) return;
    if (max && total > max.hours * 60 + max.minutes) return;

    hoursRef.current = newH;
    minutesRef.current = newM;
    setHours(newH);
    setMinutes(newM);
  };

  const getSpeed = (count: number): number => {
    // Acceleration tiers based on repetition count
    if (count >= 15) return 25; // Very fast
    if (count >= 10) return 50; // Fast
    if (count >= 5) return 100; // Medium
    return 200; // Initial speed
  };

  const handlePressIn = (action: ActionType) => {
    // Execute immediately on press
    executeAction(action);
    repetitionCount.current = 0;

    // Start the initial timer (300ms delay before repeating)
    pressTimer.current = setTimeout(() => {
      repetitionCount.current = 1;

      // Start repeating with acceleration
      const startRepeating = () => {
        if (pressInterval.current) clearInterval(pressInterval.current);

        const speed = getSpeed(repetitionCount.current);
        pressInterval.current = setInterval(() => {
          executeAction(action);
          repetitionCount.current++;

          // Check if we need to accelerate
          const newSpeed = getSpeed(repetitionCount.current);
          if (newSpeed !== speed) {
            startRepeating(); // Restart with new speed
          }
        }, speed);
      };

      startRepeating();
    }, 300);
  };

  const handlePressOut = () => {
    // Clear all timers
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (pressInterval.current) {
      clearInterval(pressInterval.current);
      pressInterval.current = null;
    }
    repetitionCount.current = 0;
  };

  const handleConfirm = () => {
    onConfirm(hours, minutes);
    onClose();
  };

  const styles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {title || t("timePicker.selectCompletionTime")}
            </Text>
          </View>

          <View style={styles.clockContainer}>
            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPressIn={() => handlePressIn("incrementHours")}
                onPressOut={handlePressOut}
              >
                <Ionicons name="chevron-up" size={32} color={theme.primary} />
              </TouchableOpacity>

              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {hours.toString().padStart(2, "0")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.arrowButton}
                onPressIn={() => handlePressIn("decrementHours")}
                onPressOut={handlePressOut}
              >
                <Ionicons name="chevron-down" size={32} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.separator}>:</Text>

            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPressIn={() => handlePressIn("incrementMinutes")}
                onPressOut={handlePressOut}
              >
                <Ionicons name="chevron-up" size={32} color={theme.primary} />
              </TouchableOpacity>

              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {minutes.toString().padStart(2, "0")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.arrowButton}
                onPressIn={() => handlePressIn("decrementMinutes")}
                onPressOut={handlePressOut}
              >
                <Ionicons name="chevron-down" size={32} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
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
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      width: 320,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
    },
    clockContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    timeColumn: {
      alignItems: "center",
    },
    arrowButton: {
      padding: 8,
    },
    timeDisplay: {
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 16,
      marginVertical: 8,
      minWidth: 80,
      alignItems: "center",
    },
    timeText: {
      fontSize: 48,
      fontWeight: "bold",
      color: theme.primary,
    },
    separator: {
      fontSize: 48,
      fontWeight: "bold",
      color: theme.text,
      marginHorizontal: 16,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: theme.borderLight,
      borderRadius: 8,
    },
    cancelText: {
      textAlign: "center",
      fontWeight: "600",
      color: theme.text,
      fontSize: 16,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    confirmText: {
      textAlign: "center",
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 16,
    },
  });
