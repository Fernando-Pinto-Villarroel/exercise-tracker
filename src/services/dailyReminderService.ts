import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import i18n from "../i18n";
import { useExerciseStore } from "../store/exerciseStore";

// Configuration - easy to extend
const CONFIG = {
  START_HOUR: 7, // 7 AM
  END_HOUR: 22, // 10 PM (22:00)
  NOTIFICATIONS_PER_DAY: 2,
  DAYS_AHEAD: 7, // Schedule reminders for a full week
  CHANNEL_ID: "daily-reminder",
};

const LAST_SCHEDULED_DATE_KEY = "last_scheduled_reminder_date";

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

    // Save the last date we scheduled up to
    if (lastScheduled) {
      await AsyncStorage.setItem(LAST_SCHEDULED_DATE_KEY, lastScheduled);
    }

    console.log(`Reminders scheduled up to ${lastScheduled}`);
  } catch (error) {
    console.error("Error scheduling daily reminders:", error);
  }
};

/**
 * Initialize daily reminders
 * Call this when the app starts
 *
 * HOW TO EXTEND:
 * - Add more messages: Edit i18n files (en.json, es.json) under "dailyReminder.messages"
 * - Change hours: Modify CONFIG.START_HOUR and CONFIG.END_HOUR
 * - Multiple reminders per day: Modify CONFIG.NOTIFICATIONS_PER_DAY
 * - More days ahead: Modify CONFIG.DAYS_AHEAD
 */
export const initializeDailyReminders = async (): Promise<void> => {
  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    // Create notification channel for Android
    await Notifications.setNotificationChannelAsync(CONFIG.CHANNEL_ID, {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });

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
    console.log("Daily reminders canceled");
  } catch (error) {
    console.error("Error canceling daily reminders:", error);
  }
};
