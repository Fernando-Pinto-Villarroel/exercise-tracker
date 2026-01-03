import { create } from "zustand";
import { getDatabase } from "../database/init";
import { UserInfo } from "../types";

interface UserStore {
  userInfo: UserInfo | null;
  isOnboarded: boolean;
  loadUserData: () => Promise<void>;
  saveUserInfo: (info: Omit<UserInfo, "id" | "created_at">) => Promise<void>;
  resetUserData: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  userInfo: null,
  isOnboarded: false,

  loadUserData: async () => {
    const db = getDatabase();
    const result = await db.getFirstAsync<UserInfo>(
      "SELECT * FROM user_info ORDER BY id DESC LIMIT 1"
    );

    set({
      userInfo: result || null,
      isOnboarded: !!result,
    });
  },

  saveUserInfo: async (info) => {
    const db = getDatabase();
    const created_at = new Date().toISOString();

    await db.runAsync(
      "INSERT INTO user_info (full_name, age, height, weight, created_at) VALUES (?, ?, ?, ?, ?)",
      [info.full_name, info.age, info.height, info.weight, created_at]
    );

    await useUserStore.getState().loadUserData();
  },

  resetUserData: async () => {
    const db = getDatabase();
    await db.execAsync(`
      DELETE FROM user_info;
      DELETE FROM weekly_plan;
      DELETE FROM daily_snapshot;
      DELETE FROM daily_completion;
    `);
    set({ userInfo: null, isOnboarded: false });
  },
}));
