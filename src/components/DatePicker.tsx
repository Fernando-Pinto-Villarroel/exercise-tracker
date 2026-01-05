import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "YYYY-MM-DD",
  minYear = 1900,
  maxYear = new Date().getFullYear(),
}: DatePickerProps) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    value ? new Date(value).getFullYear() : maxYear
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    value ? new Date(value).getMonth() : 0
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    value ? new Date(value).getDate() : 1
  );

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
  };

  const handleConfirm = () => {
    const date = formatDate(selectedYear, selectedMonth, selectedDay);
    onChange(date);
    setShowPicker(false);
  };

  const handleOpen = () => {
    if (value) {
      const date = new Date(value);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
    }
    setShowPicker(true);
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : placeholder;

  const styles = createStyles(theme);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={handleOpen}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayValue}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.primary} />
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.columnTitle}>Year</Text>
                <ScrollView style={styles.scrollView}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === year &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.columnTitle}>Month</Text>
                <ScrollView style={styles.scrollView}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth === index &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.columnTitle}>Day</Text>
                <ScrollView style={styles.scrollView}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDay === day && styles.pickerItemTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: theme.card,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    inputText: {
      fontSize: 16,
      color: theme.text,
    },
    placeholder: {
      color: theme.textTertiary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    pickerContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    pickerColumn: {
      flex: 1,
    },
    columnTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
    },
    scrollView: {
      maxHeight: 300,
      borderRadius: 8,
      backgroundColor: theme.background,
    },
    pickerItem: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    pickerItemSelected: {
      backgroundColor: theme.primaryLight,
    },
    pickerItemText: {
      fontSize: 16,
      color: theme.text,
    },
    pickerItemTextSelected: {
      color: theme.primary,
      fontWeight: "600",
    },
    confirmButton: {
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    confirmButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
