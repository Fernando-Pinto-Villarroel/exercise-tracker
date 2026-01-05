import * as SQLite from "expo-sqlite";
import { create } from "zustand";
import { resetThemeGlobally } from "../contexts/ThemeContext";
import { getDatabase, initDatabase } from "../database/init";
import i18n from "../i18n";
import { UserInfo } from "../types";

interface UserStore {
  userInfo: UserInfo | null;
  isOnboarded: boolean;
  loadUserData: () => Promise<void>;
  saveUserInfo: (info: Omit<UserInfo, "id" | "created_at">) => Promise<void>;
  resetUserData: () => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  userInfo: null,
  isOnboarded: false,

  loadUserData: async () => {
    const db = getDatabase();
    const result = await db.getFirstAsync<UserInfo>(
      "SELECT * FROM user_info ORDER BY id DESC LIMIT 1"
    );

    if (result?.language) {
      i18n.changeLanguage(result.language);
    }

    set({
      userInfo: result || null,
      isOnboarded: !!result,
    });
  },

  saveUserInfo: async (info) => {
    const db = getDatabase();
    const created_at = new Date().toISOString();

    await db.runAsync(
      "INSERT INTO user_info (full_name, birthday, gender, created_at, language, theme) VALUES (?, ?, ?, ?, ?, ?)",
      [
        info.full_name,
        info.birthday,
        info.gender,
        created_at,
        info.language || "en",
        info.theme || "light",
      ]
    );

    await useUserStore.getState().loadUserData();
  },

  resetUserData: async () => {
    try {
      const db = getDatabase();
      await db.closeAsync();
      await SQLite.deleteDatabaseAsync("exercise_tracker.db");
      await initDatabase();

      resetThemeGlobally();

      i18n.changeLanguage("en");

      set({ userInfo: null, isOnboarded: false });
    } catch (error) {
      console.error("Error resetting user data:", error);
      throw error;
    }
  },

  updateLanguage: async (language: string) => {
    const db = getDatabase();
    await db.runAsync(
      "UPDATE user_info SET language = ? WHERE id = (SELECT id FROM user_info ORDER BY id DESC LIMIT 1)",
      [language]
    );
    i18n.changeLanguage(language);
    await useUserStore.getState().loadUserData();
  },
}));
