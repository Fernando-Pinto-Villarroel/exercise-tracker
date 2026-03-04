import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";
import i18n from "../i18n";
import { useExerciseStore } from "../store/exerciseStore";

// Configuration - easy to extend
const CONFIG = {
  START_HOUR: 7, // 7 AM
  END_HOUR: 21, // 9 PM (21:00)
  NOTIFICATIONS_PER_DAY: 2,
  DAYS_AHEAD: 7, // Schedule reminders for a full week
  CHANNEL_ID: "daily-reminder",
};

const LAST_SCHEDULED_DATE_KEY = "last_scheduled_reminder_date";
const LAST_SCHEDULED_LANGUAGE_KEY = "last_scheduled_reminder_language";

/**
 * Format a Date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * Get a random integer between min and max (inclusive)
 */
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Get a random time between START_HOUR and END_HOUR
 */
const getRandomTime = (): { hour: number; minute: number } => {
  const hour = getRandomInt(CONFIG.START_HOUR, CONFIG.END_HOUR - 1);
  const minute = getRandomInt(0, 59);
  return { hour, minute };
};

/**
 * Get a random reminder message from i18n
 */
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

/**
 * Schedule daily reminder notifications for the next 7 days using DATE trigger
 * so they fire even when the app is not open.
 *
 * Each time the app opens, it checks which days still need scheduling
 * and fills up the week ahead.
 */
export const scheduleDailyReminders = async (): Promise<void> => {
  try {
    const { isRestDay } = useExerciseStore.getState();
    const now = new Date();
    const today = formatDate(now);

    // Get the last date we scheduled up to
    const lastScheduledDate = await AsyncStorage.getItem(
      LAST_SCHEDULED_DATE_KEY,
    );

    // Determine the first day that needs scheduling
    let startDate: Date;
    if (lastScheduledDate && lastScheduledDate >= today) {
      // We already scheduled up to lastScheduledDate, start from the day after
      startDate = new Date(lastScheduledDate + "T00:00:00");
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // No previous scheduling or it's outdated, start from today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    }

    // Calculate the target end date (7 days from today)
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + CONFIG.DAYS_AHEAD - 1);
    endDate.setHours(23, 59, 59, 999);

    // If we've already scheduled the full week, nothing to do
    if (startDate > endDate) {
      console.log("Reminders already scheduled for the full week");
      return;
    }

    let lastScheduled = lastScheduledDate || "";

    // Schedule notifications for each day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);

      // Skip rest days
      const isRest = await isRestDay(dateStr);
      if (!isRest) {
        for (let i = 0; i < CONFIG.NOTIFICATIONS_PER_DAY; i++) {
          const { hour, minute } = getRandomTime();
          const { title, body } = getRandomMessage();

          const triggerDate = new Date(currentDate);
          triggerDate.setHours(hour, minute, 0, 0);

          // Skip if the time has already passed
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

      lastScheduled = dateStr;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save the last date and language we scheduled with
    if (lastScheduled) {
      await AsyncStorage.setItem(LAST_SCHEDULED_DATE_KEY, lastScheduled);
      await AsyncStorage.setItem(LAST_SCHEDULED_LANGUAGE_KEY, i18n.language);
    }

    console.log(`Reminders scheduled up to ${lastScheduled}`);
  } catch (error) {
    console.error("Error scheduling daily reminders:", error);
  }
};

/**
 * Cancel all scheduled reminders and re-schedule from scratch.
 * Call this when the language changes so new messages are in the correct language.
 */
export const rescheduleDailyReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(LAST_SCHEDULED_DATE_KEY);
    await AsyncStorage.removeItem(LAST_SCHEDULED_LANGUAGE_KEY);
    await scheduleDailyReminders();
    console.log("Daily reminders rescheduled");
  } catch (error) {
    console.error("Error rescheduling daily reminders:", error);
  }
};

/**
 * Initialize daily reminders.
 * Call this when the app starts.
 *
 * HOW TO EXTEND:
 * - Add more messages: Edit i18n files (en.json, es.json) under "dailyReminder.messages"
 * - Change hours: Modify CONFIG.START_HOUR and CONFIG.END_HOUR
 * - Multiple reminders per day: Modify CONFIG.NOTIFICATIONS_PER_DAY
 * - More days ahead: Modify CONFIG.DAYS_AHEAD
 */
export const initializeDailyReminders = async (): Promise<void> => {
  try {
    // Request notification permissions (POST_NOTIFICATIONS on Android 13+)
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    // On Android 12+ (API 31+) exact alarms also need the SCHEDULE_EXACT_ALARM
    // permission to be granted by the user under Settings > Apps > Special app
    // access > Alarms & reminders. Prompt them if the OS version warrants it.
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
        // Continue anyway — the OS may still deliver inexact alarms
      }
    }

    // Create notification channel for Android
    await Notifications.setNotificationChannelAsync(CONFIG.CHANNEL_ID, {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });

    // If existing notifications were scheduled in a different language,
    // cancel them and reschedule so messages match the current language.
    const scheduledLang = await AsyncStorage.getItem(
      LAST_SCHEDULED_LANGUAGE_KEY,
    );
    if (scheduledLang && scheduledLang !== i18n.language) {
      console.log(
        `Language changed (${scheduledLang} → ${i18n.language}), rescheduling reminders`,
      );
      await rescheduleDailyReminders();
      return;
    }

    // Schedule reminders for the week ahead
    await scheduleDailyReminders();

    console.log("Daily reminders initialized");
  } catch (error) {
    console.error("Error initializing daily reminders:", error);
  }
};

/**
 * Cancel all scheduled daily reminders
 */
export const cancelDailyReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(LAST_SCHEDULED_DATE_KEY);
    await AsyncStorage.removeItem(LAST_SCHEDULED_LANGUAGE_KEY);
    console.log("Daily reminders canceled");
  } catch (error) {
    console.error("Error canceling daily reminders:", error);
  }
};
