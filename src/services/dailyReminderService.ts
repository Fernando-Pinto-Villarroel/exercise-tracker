import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import i18n from "../i18n";
import { useExerciseStore } from "../store/exerciseStore";

// Configuration - easy to extend
const CONFIG = {
  START_HOUR: 7, // 7 AM
  END_HOUR: 22, // 10 PM (22:00)
  NOTIFICATIONS_PER_DAY: 2,
  CHANNEL_ID: "daily-reminder",
};

const LAST_REMINDER_DATE_KEY = "last_reminder_date";
const REMINDER_SENT_TODAY_KEY = "reminder_sent_today";

/**
 * Get today's date as YYYY-MM-DD
 */
const getTodayDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
 * Check if we should send a reminder today
 */
const shouldSendReminderToday = async (): Promise<boolean> => {
  const today = getTodayDate();
  const lastReminderDate = await AsyncStorage.getItem(LAST_REMINDER_DATE_KEY);

  // If we already scheduled reminders today, don't schedule again
  if (lastReminderDate === today) {
    return false;
  }

  // Check if today is a rest day
  const { isRestDay } = useExerciseStore.getState();
  const isRestDayToday = await isRestDay(today);

  if (isRestDayToday) {
    console.log("Today is a rest day, skipping reminder");
    return false;
  }

  return true;
};

/**
 * Mark that we scheduled reminders today
 */
const markReminderSent = async (): Promise<void> => {
  const today = getTodayDate();
  await AsyncStorage.setItem(LAST_REMINDER_DATE_KEY, today);
};

/**
 * Schedule daily reminder notifications using DATE trigger
 * so they fire even when the app is not open.
 */
export const scheduleDailyReminder = async (): Promise<void> => {
  try {
    // Check if we should send reminders
    const shouldSend = await shouldSendReminderToday();
    if (!shouldSend) {
      console.log("Skipping daily reminder (already scheduled or rest day)");
      return;
    }

    const now = new Date();

    for (let i = 0; i < CONFIG.NOTIFICATIONS_PER_DAY; i++) {
      const { hour, minute } = getRandomTime();
      const { title, body } = getRandomMessage();

      // Calculate trigger date
      const triggerDate = new Date();
      triggerDate.setHours(hour, minute, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      // Schedule with DATE trigger - fires even when app is closed
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
        `Daily reminder ${i + 1} scheduled for ${triggerDate.toLocaleString()} - "${title}: ${body}"`,
      );
    }

    // Mark as scheduled
    await markReminderSent();
  } catch (error) {
    console.error("Error scheduling daily reminder:", error);
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

    // Schedule the reminder (will check if it should be sent)
    await scheduleDailyReminder();

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
    await AsyncStorage.removeItem(LAST_REMINDER_DATE_KEY);
    await AsyncStorage.removeItem(REMINDER_SENT_TODAY_KEY);
    console.log("Daily reminders canceled");
  } catch (error) {
    console.error("Error canceling daily reminders:", error);
  }
};
