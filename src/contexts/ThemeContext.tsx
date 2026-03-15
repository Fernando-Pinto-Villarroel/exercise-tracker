import React, { createContext, useContext, useEffect, useState } from "react";
import { getDatabase } from "../database/init";
import {
  DEFAULT_PALETTE_ID,
  ThemeColors,
  getPaletteById,
} from "../themes/palettes";

let globalResetTheme: () => void = () => {};

export const setGlobalResetTheme = (resetFunction: () => void) => {
  globalResetTheme = resetFunction;
};

export const resetThemeGlobally = () => {
  globalResetTheme();
};

const defaultPalette = getPaletteById(DEFAULT_PALETTE_ID);

export const lightTheme = defaultPalette.light;
export const darkTheme = defaultPalette.dark;

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  resetTheme: () => void;
  loadThemePreference: () => Promise<void>;
  paletteId: string;
  setColorPalette: (id: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  resetTheme: () => {},
  loadThemePreference: async () => {},
  paletteId: DEFAULT_PALETTE_ID,
  setColorPalette: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);

  const loadThemePreference = async () => {
    try {
      const db = getDatabase();
      if (!db) {
        return;
      }

      const result = await db.getFirstAsync<{
        theme: string;
        color_palette: string;
      }>("SELECT theme, color_palette FROM user_info ORDER BY id DESC LIMIT 1");

      if (result?.theme === "dark") {
        setIsDark(true);
      } else if (result?.theme === "light") {
        setIsDark(false);
      }

      if (result?.color_palette) {
        setPaletteId(result.color_palette);
      }
    } catch {
      setIsDark(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    try {
      const db = getDatabase();
      if (!db) return;

      await db.runAsync(
        "UPDATE user_info SET theme = ? WHERE id = (SELECT id FROM user_info ORDER BY id DESC LIMIT 1)",
        [newTheme ? "dark" : "light"],
      );
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const setColorPalette = async (id: string) => {
    const palette = getPaletteById(id);
    if (!palette) return;

    setPaletteId(id);

    try {
      const db = getDatabase();
      if (!db) return;

      await db.runAsync(
        "UPDATE user_info SET color_palette = ? WHERE id = (SELECT id FROM user_info ORDER BY id DESC LIMIT 1)",
        [id],
      );
    } catch (error) {
      console.error("Failed to save color palette:", error);
    }
  };

  const currentPalette = getPaletteById(paletteId);
  const theme = isDark ? currentPalette.dark : currentPalette.light;

  const resetTheme = () => {
    setIsDark(false);
    setPaletteId(DEFAULT_PALETTE_ID);
  };

  useEffect(() => {
    setGlobalResetTheme(resetTheme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        resetTheme,
        loadThemePreference,
        paletteId,
        setColorPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
