import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return { year, month: month - 1, day };
  };

  const [selectedYear, setSelectedYear] = useState<number>(
    value ? parseDateString(value).year : maxYear,
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    value ? parseDateString(value).month : 0,
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    value ? parseDateString(value).day : 1,
  );

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i,
  );

  const months: string[] = t("datePicker.months", {
    returnObjects: true,
  }) as string[];

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
      const { year, month, day } = parseDateString(value);
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
    }
    setShowPicker(true);
  };

  const displayValue = value
    ? (() => {
        const { year, month, day } = parseDateString(value);
        return `${months[month]} ${day}, ${year}`;
      })()
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
              <Text style={styles.modalTitle}>
                {t("datePicker.selectDate")}
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.columnTitle}>{t("datePicker.year")}</Text>
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
                <Text style={styles.columnTitle}>{t("datePicker.month")}</Text>
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
                <Text style={styles.columnTitle}>{t("datePicker.day")}</Text>
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
              <Text style={styles.confirmButtonText}>
                {t("datePicker.confirm")}
              </Text>
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
      padding: 22,
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
      marginBottom: 40,
    },
    confirmButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
