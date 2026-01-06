import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hours: number, minutes: number) => void;
  initialHours?: number;
  initialMinutes?: number;
}

export default function TimePicker({
  visible,
  onClose,
  onConfirm,
  initialHours = new Date().getHours(),
  initialMinutes = new Date().getMinutes(),
}: TimePickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);

  const incrementHours = () => {
    setHours((prev) => (prev + 1) % 24);
  };

  const decrementHours = () => {
    setHours((prev) => (prev - 1 + 24) % 24);
  };

  const incrementMinutes = () => {
    setMinutes((prev) => (prev + 1) % 60);
  };

  const decrementMinutes = () => {
    setMinutes((prev) => (prev - 1 + 60) % 60);
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
            <Text style={styles.modalTitle}>Select Completion Time</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.clockContainer}>
            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={incrementHours}
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
                onPress={decrementHours}
              >
                <Ionicons name="chevron-down" size={32} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.separator}>:</Text>

            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={incrementMinutes}
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
                onPress={decrementMinutes}
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
