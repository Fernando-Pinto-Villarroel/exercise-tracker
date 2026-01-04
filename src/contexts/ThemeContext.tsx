import React, { createContext, useContext, useEffect, useState } from "react";
import { getDatabase } from "../database/init";

// Función global para reiniciar el tema
let globalResetTheme: () => void = () => {};

export const setGlobalResetTheme = (resetFunction: () => void) => {
  globalResetTheme = resetFunction;
};

export const resetThemeGlobally = () => {
  globalResetTheme();
};

export const lightTheme = {
  background: "#f9fafb",
  card: "#ffffff",
  text: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  primary: "#3b82f6",
  primaryLight: "#dbeafe",
  success: "#16a34a",
  successLight: "#10b981",
  error: "#ef4444",
  errorDark: "#dc2626",
  border: "#d1d5db",
  borderLight: "#e5e7eb",
  iconBackground: "#eff6ff",
  shadow: "#000",
  headerBackground: "#3b82f6",
  headerText: "#fff",
  buttonDisabled: "#d1d5db",
  modalOverlay: "rgba(0,0,0,0.5)",
};

export const darkTheme = {
  background: "#111827",
  card: "#1f2937",
  text: "#f9fafb",
  textSecondary: "#d1d5db",
  textTertiary: "#9ca3af",
  primary: "#60a5fa",
  primaryLight: "#1e40af",
  success: "#22c55e",
  successLight: "#16a34a",
  error: "#f87171",
  errorDark: "#ef4444",
  border: "#374151",
  borderLight: "#4b5563",
  iconBackground: "#1e3a5f",
  shadow: "#000",
  headerBackground: "#1f2937",
  headerText: "#f9fafb",
  buttonDisabled: "#4b5563",
  modalOverlay: "rgba(0,0,0,0.7)",
};

interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  resetTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const db = getDatabase();
      const result = await db.getFirstAsync<{ theme: string }>(
        "SELECT theme FROM user_info ORDER BY id DESC LIMIT 1"
      );
      // Si hay un resultado, aplicar el tema, si no, mantener el valor por defecto (light)
      if (result?.theme === "dark") {
        setIsDark(true);
      } else if (result?.theme === "light") {
        setIsDark(false);
      }
      // Si no hay resultado, se mantiene el valor inicial (false = light mode)
    } catch (error) {
      console.log("No theme preference found, using default light theme");
      setIsDark(false); // Asegurarse de que vuelva al valor por defecto
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    try {
      const db = getDatabase();
      await db.runAsync(
        "UPDATE user_info SET theme = ? WHERE id = (SELECT id FROM user_info ORDER BY id DESC LIMIT 1)",
        [newTheme ? "dark" : "light"]
      );
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const resetTheme = () => {
    setIsDark(false);
  };

  // Registrar la función global para reiniciar el tema
  useEffect(() => {
    setGlobalResetTheme(resetTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
