import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";
import { getDatabase } from "../database/init";
import i18n from "../i18n";
import { useExerciseStore } from "../store/exerciseStore";
import { NotificationSettings } from "../types";

const DEFAULT_CONFIG = {
  NOTIFICATIONS_PER_DAY: 2,
  START_HOUR: 7,
  START_MINUTE: 0,
  END_HOUR: 21,
  END_MINUTE: 0,
  ENABLED_DAYS: [0, 1, 2, 3, 4, 5, 6],
  DAYS_AHEAD: 7,
  CHANNEL_ID: "daily-reminder",
};

const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomTimeInRange = (
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): { hour: number; minute: number } => {
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  if (startTotal >= endTotal) {
    return { hour: startHour, minute: startMinute };
  }
  const randomTotal = getRandomInt(startTotal, endTotal - 1);
  return {
    hour: Math.floor(randomTotal / 60),
    minute: randomTotal % 60,
  };
};

const getRandomMessage = (): { title: string; body: string } => {
  const messages = i18n.t("dailyReminder.messages", {
    returnObjects: true,
  }) as Array<{
    title: string;
    body: string;
  }>;

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      title: "Exercise Reminder",
      body: "Time to train!",
    };
  }

  const randomIndex = getRandomInt(0, messages.length - 1);
  return messages[randomIndex];
};

export const loadNotificationSettings = async (): Promise<{
  notificationsPerDay: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  enabledDays: number[];
}> => {
  try {
    const db = getDatabase();
    if (!db) {
      return {
        notificationsPerDay: DEFAULT_CONFIG.NOTIFICATIONS_PER_DAY,
        startHour: DEFAULT_CONFIG.START_HOUR,
        startMinute: DEFAULT_CONFIG.START_MINUTE,
        endHour: DEFAULT_CONFIG.END_HOUR,
        endMinute: DEFAULT_CONFIG.END_MINUTE,
        enabledDays: DEFAULT_CONFIG.ENABLED_DAYS,
      };
    }

    const settings = await db.getFirstAsync<NotificationSettings>(
      "SELECT * FROM notification_settings ORDER BY id DESC LIMIT 1",
    );

    if (!settings) {
      return {
        notificationsPerDay: DEFAULT_CONFIG.NOTIFICATIONS_PER_DAY,
        startHour: DEFAULT_CONFIG.START_HOUR,
        startMinute: DEFAULT_CONFIG.START_MINUTE,
        endHour: DEFAULT_CONFIG.END_HOUR,
        endMinute: DEFAULT_CONFIG.END_MINUTE,
        enabledDays: DEFAULT_CONFIG.ENABLED_DAYS,
      };
    }

    let enabledDays: number[];
    try {
      enabledDays = JSON.parse(settings.enabled_days);
    } catch {
      enabledDays = DEFAULT_CONFIG.ENABLED_DAYS;
    }

    return {
      notificationsPerDay: settings.notifications_per_day,
      startHour: settings.start_hour,
      startMinute: settings.start_minute,
      endHour: settings.end_hour,
      endMinute: settings.end_minute,
      enabledDays,
    };
  } catch {
    return {
      notificationsPerDay: DEFAULT_CONFIG.NOTIFICATIONS_PER_DAY,
      startHour: DEFAULT_CONFIG.START_HOUR,
      startMinute: DEFAULT_CONFIG.START_MINUTE,
      endHour: DEFAULT_CONFIG.END_HOUR,
      endMinute: DEFAULT_CONFIG.END_MINUTE,
      enabledDays: DEFAULT_CONFIG.ENABLED_DAYS,
    };
  }
};

export const saveNotificationSettings = async (settings: {
  notificationsPerDay: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  enabledDays: number[];
}): Promise<void> => {
  const db = getDatabase();
  if (!db) return;

  await db.runAsync(
    "UPDATE notification_settings SET notifications_per_day = ?, start_hour = ?, start_minute = ?, end_hour = ?, end_minute = ?, enabled_days = ? WHERE id = (SELECT id FROM notification_settings ORDER BY id DESC LIMIT 1)",
    [
      settings.notificationsPerDay,
      settings.startHour,
      settings.startMinute,
      settings.endHour,
      settings.endMinute,
      JSON.stringify(settings.enabledDays),
    ],
  );
};

export const scheduleDailyReminders = async (
  skipToday: boolean = false,
): Promise<void> => {
  try {
    const { isRestDay } = useExerciseStore.getState();
    const config = await loadNotificationSettings();
    const now = new Date();

    if (config.notificationsPerDay <= 0) {
      console.log("Notifications disabled (0 per day)");
      return;
    }

    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    if (skipToday) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + DEFAULT_CONFIG.DAYS_AHEAD - 1);
    endDate.setHours(23, 59, 59, 999);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayOfWeek = currentDate.getDay();

      const isDayEnabled = config.enabledDays.includes(dayOfWeek);
      const isRest = await isRestDay(dateStr);

      if (!isRest && isDayEnabled) {
        for (let i = 0; i < config.notificationsPerDay; i++) {
          const { hour, minute } = getRandomTimeInRange(
            config.startHour,
            config.startMinute,
            config.endHour,
            config.endMinute,
          );
          const { title, body } = getRandomMessage();

          const triggerDate = new Date(currentDate);
          triggerDate.setHours(hour, minute, 0, 0);

          if (triggerDate > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
              },
            });

            console.log(
              `Reminder scheduled for ${triggerDate.toLocaleString()} - "${title}"`,
            );
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(
      `Reminders scheduled for next ${DEFAULT_CONFIG.DAYS_AHEAD} days`,
    );
  } catch (error) {
    console.error("Error scheduling daily reminders:", error);
  }
};

export const rescheduleDailyReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await scheduleDailyReminders(false);
    console.log("Daily reminders rescheduled");
  } catch (error) {
    console.error("Error rescheduling daily reminders:", error);
  }
};

export const initializeDailyReminders = async (): Promise<void> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    if (
      Platform.OS === "android" &&
      typeof Platform.Version === "number" &&
      Platform.Version >= 31
    ) {
      const { granted: hasExactAlarm } =
        await Notifications.getPermissionsAsync();
      if (!hasExactAlarm) {
        Alert.alert(
          "Enable Alarms & Reminders",
          "To receive workout reminders on time, please allow this app to schedule exact alarms in Settings.",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    }

    await Notifications.setNotificationChannelAsync(DEFAULT_CONFIG.CHANNEL_ID, {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });

    const todayStr = formatDate(new Date());
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const hasTodayPending = scheduled.some((n) => {
      const trigger = n.trigger as {
        dateComponents?: { year?: number; month?: number; day?: number };
        value?: number;
        date?: number;
      } | null;
      if (!trigger) return false;

      const ts =
        (trigger as { value?: number }).value ??
        (trigger as { date?: number }).date;
      if (ts != null) {
        return formatDate(new Date(ts)) === todayStr;
      }
      return false;
    });

    const futureCancels = scheduled.filter((n) => {
      const trigger = n.trigger as { value?: number; date?: number } | null;
      if (!trigger) return true;
      const ts = trigger.value ?? trigger.date;
      if (ts != null) {
        return formatDate(new Date(ts)) !== todayStr;
      }
      return true;
    });
    for (const n of futureCancels) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }

    await scheduleDailyReminders(hasTodayPending);

    console.log(
      `Daily reminders initialized (skipToday=${hasTodayPending}, todayPending=${scheduled.length - futureCancels.length})`,
    );
  } catch (error) {
    console.error("Error initializing daily reminders:", error);
  }
};

export const cancelDailyReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Daily reminders canceled");
  } catch (error) {
    console.error("Error canceling daily reminders:", error);
  }
};
