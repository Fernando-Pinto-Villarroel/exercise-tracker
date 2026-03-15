import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TimePicker from "../components/TimePicker";
import { useTheme } from "../contexts/ThemeContext";
import {
  loadNotificationSettings,
  rescheduleDailyReminders,
  saveNotificationSettings,
} from "../services/dailyReminderService";

const DAY_KEYS = [
  "myExercises.days.sunday",
  "myExercises.days.monday",
  "myExercises.days.tuesday",
  "myExercises.days.wednesday",
  "myExercises.days.thursday",
  "myExercises.days.friday",
  "myExercises.days.saturday",
];

const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [notificationsPerDay, setNotificationsPerDay] = useState(2);
  const [startHour, setStartHour] = useState(7);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(21);
  const [endMinute, setEndMinute] = useState(0);
  const [enabledDays, setEnabledDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotificationSettings().then((s) => {
        setNotificationsPerDay(s.notificationsPerDay);
        setStartHour(s.startHour);
        setStartMinute(s.startMinute);
        setEndHour(s.endHour);
        setEndMinute(s.endMinute);
        setEnabledDays(s.enabledDays);
      });
    }, []),
  );

  const persist = async (overrides: Record<string, any> = {}) => {
    const settings = {
      notificationsPerDay,
      startHour,
      startMinute,
      endHour,
      endMinute,
      enabledDays,
      ...overrides,
    };
    await saveNotificationSettings(settings);
    await rescheduleDailyReminders();
  };

  const handleIncrement = async () => {
    if (notificationsPerDay >= 10) return;
    const next = notificationsPerDay + 1;
    setNotificationsPerDay(next);
    await persist({ notificationsPerDay: next });
  };

  const handleDecrement = async () => {
    if (notificationsPerDay <= 0) return;
    const next = notificationsPerDay - 1;
    setNotificationsPerDay(next);
    await persist({ notificationsPerDay: next });
  };

  const handleStartTimeConfirm = async (h: number, m: number) => {
    const startTotal = h * 60 + m;
    const endTotal = endHour * 60 + endMinute;

    const overrides: Record<string, number> = { startHour: h, startMinute: m };
    setStartHour(h);
    setStartMinute(m);

    if (startTotal >= endTotal) {
      const bumped = Math.min(startTotal + 60, 23 * 60 + 59);
      const newEndH = Math.floor(bumped / 60);
      const newEndM = bumped % 60;
      setEndHour(newEndH);
      setEndMinute(newEndM);
      overrides.endHour = newEndH;
      overrides.endMinute = newEndM;
    }

    await persist(overrides);
  };

  const handleEndTimeConfirm = async (h: number, m: number) => {
    const endTotal = h * 60 + m;
    const startTotal = startHour * 60 + startMinute;

    const overrides: Record<string, number> = { endHour: h, endMinute: m };
    setEndHour(h);
    setEndMinute(m);

    if (endTotal <= startTotal) {
      const bumped = Math.max(endTotal - 60, 0);
      const newStartH = Math.floor(bumped / 60);
      const newStartM = bumped % 60;
      setStartHour(newStartH);
      setStartMinute(newStartM);
      overrides.startHour = newStartH;
      overrides.startMinute = newStartM;
    }

    await persist(overrides);
  };

  const toggleDay = async (day: number) => {
    const next = enabledDays.includes(day)
      ? enabledDays.filter((d) => d !== day)
      : [...enabledDays, day].sort();
    setEnabledDays(next);
    await persist({ enabledDays: next });
  };

  const formatTime = (h: number, m: number) =>
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>{t("notifications.subtitle")}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t("notifications.notificationsPerDay")}
        </Text>
        <Text style={styles.sectionDescription}>
          {t("notifications.notificationsPerDayDescription")}
        </Text>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[
              styles.stepperButton,
              notificationsPerDay <= 0 && styles.stepperButtonDisabled,
            ]}
            onPress={handleDecrement}
            disabled={notificationsPerDay <= 0}
          >
            <Ionicons
              name="remove"
              size={24}
              color={notificationsPerDay <= 0 ? theme.textTertiary : "#fff"}
            />
          </TouchableOpacity>

          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{notificationsPerDay}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.stepperButton,
              notificationsPerDay >= 10 && styles.stepperButtonDisabled,
            ]}
            onPress={handleIncrement}
            disabled={notificationsPerDay >= 10}
          >
            <Ionicons
              name="add"
              size={24}
              color={notificationsPerDay >= 10 ? theme.textTertiary : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {notificationsPerDay === 0 && (
          <Text style={styles.disabledNotice}>
            {t("notifications.notificationsDisabled")}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t("notifications.timeWindow")}
        </Text>
        <Text style={styles.sectionDescription}>
          {t("notifications.timeWindowDescription")}
        </Text>

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>{t("notifications.from")}</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={styles.timeButtonText}>
                {formatTime(startHour, startMinute)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>{t("notifications.to")}</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={styles.timeButtonText}>
                {formatTime(endHour, endMinute)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t("notifications.activeDays")}
        </Text>
        <Text style={styles.sectionDescription}>
          {t("notifications.activeDaysDescription")}
        </Text>

        <View style={styles.daysRow}>
          {DAY_SHORT.map((label, index) => {
            const isActive = enabledDays.includes(index);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayChip, isActive && styles.dayChipActive]}
                onPress={() => toggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isActive && styles.dayChipTextActive,
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.dayChipName,
                    isActive && styles.dayChipNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {t(DAY_KEYS[index]).slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
        <Text style={styles.infoText}>{t("notifications.restDayInfo")}</Text>
      </View>

      <TimePicker
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onConfirm={handleStartTimeConfirm}
        initialHours={startHour}
        initialMinutes={startMinute}
        maxTime={{
          hours: Math.floor(Math.max(endHour * 60 + endMinute - 1, 0) / 60),
          minutes: Math.max(endHour * 60 + endMinute - 1, 0) % 60,
        }}
        title={t("notifications.from")}
      />

      <TimePicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onConfirm={handleEndTimeConfirm}
        initialHours={endHour}
        initialMinutes={endMinute}
        minTime={{
          hours: Math.floor(Math.min(startHour * 60 + startMinute + 1, 23 * 60 + 59) / 60),
          minutes: Math.min(startHour * 60 + startMinute + 1, 23 * 60 + 59) % 60,
        }}
        title={t("notifications.to")}
      />
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 4,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    stepperButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperButtonDisabled: {
      backgroundColor: theme.borderLight,
    },
    stepperValue: {
      minWidth: 60,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
    },
    stepperValueText: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.primary,
    },
    disabledNotice: {
      fontSize: 13,
      color: theme.warning || theme.textSecondary,
      textAlign: "center",
      marginTop: 12,
      fontStyle: "italic",
    },
    timeRow: {
      flexDirection: "row",
      gap: 16,
    },
    timeBlock: {
      flex: 1,
    },
    timeLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.textSecondary,
      marginBottom: 8,
    },
    timeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.primaryLight,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    timeButtonText: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.primary,
    },
    daysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
    },
    dayChip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: theme.borderLight,
    },
    dayChipActive: {
      backgroundColor: theme.primary,
    },
    dayChipText: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.textSecondary,
    },
    dayChipTextActive: {
      color: "#fff",
    },
    dayChipName: {
      fontSize: 10,
      color: theme.textTertiary,
      marginTop: 2,
    },
    dayChipNameActive: {
      color: "rgba(255,255,255,0.8)",
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.borderLight,
      borderRadius: 8,
      padding: 14,
      marginBottom: 16,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
    },
  });
