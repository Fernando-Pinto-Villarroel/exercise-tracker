export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  error: string;
  errorDark: string;
  border: string;
  borderLight: string;
  iconBackground: string;
  shadow: string;
  headerBackground: string;
  headerText: string;
  buttonDisabled: string;
  modalOverlay: string;
  restDayLight: string;
  restDayBorder: string;
  restDayBadge: string;
}

export interface ColorPalette {
  id: string;
  preview: string;
  light: ThemeColors;
  dark: ThemeColors;
}

const BASE_LIGHT = {
  text: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  success: "#16a34a",
  successLight: "#10b981",
  error: "#ef4444",
  errorDark: "#dc2626",
  shadow: "#000",
  headerText: "#fff",
  buttonDisabled: "#d1d5db",
  modalOverlay: "rgba(0,0,0,0.5)",
  restDayLight: "#cffafe",
  restDayBorder: "#06b6d4",
  restDayBadge: "#0891b2",
};

const BASE_DARK = {
  text: "#f9fafb",
  textSecondary: "#d1d5db",
  textTertiary: "#9ca3af",
  success: "#22c55e",
  successLight: "#16a34a",
  error: "#f87171",
  errorDark: "#ef4444",
  shadow: "#000",
  headerText: "#f9fafb",
  buttonDisabled: "#4b5563",
  modalOverlay: "rgba(0,0,0,0.7)",
  restDayLight: "#164e63",
  restDayBorder: "#0e7490",
  restDayBadge: "#06b6d4",
};

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "cobalt",
    preview: "#3b82f6",
    light: {
      ...BASE_LIGHT,
      background: "#f9fafb",
      card: "#ffffff",
      primary: "#3b82f6",
      primaryLight: "#dbeafe",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#eff6ff",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#111827",
      card: "#1f2937",
      primary: "#60a5fa",
      primaryLight: "#1e40af",
      border: "#374151",
      borderLight: "#4b5563",
      iconBackground: "#1e3a5f",
      headerBackground: "#1f2937",
    },
  },
  {
    id: "crimson",
    preview: "#dc2626",
    light: {
      ...BASE_LIGHT,
      background: "#fef9f9",
      card: "#ffffff",
      primary: "#dc2626",
      primaryLight: "#fee2e2",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#fef2f2",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#1a0f0f",
      card: "#291616",
      primary: "#f87171",
      primaryLight: "#991b1b",
      border: "#3f2020",
      borderLight: "#4d2a2a",
      iconBackground: "#3b1515",
      headerBackground: "#291616",
    },
  },
  {
    id: "emerald",
    preview: "#059669",
    light: {
      ...BASE_LIGHT,
      background: "#f8fdfb",
      card: "#ffffff",
      primary: "#059669",
      primaryLight: "#d1fae5",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#ecfdf5",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#0c1a15",
      card: "#14261e",
      primary: "#34d399",
      primaryLight: "#065f46",
      border: "#1f3d2e",
      borderLight: "#2a4d3a",
      iconBackground: "#1a3a2a",
      headerBackground: "#14261e",
    },
  },
  {
    id: "amber",
    preview: "#d97706",
    light: {
      ...BASE_LIGHT,
      background: "#fefcf5",
      card: "#ffffff",
      primary: "#d97706",
      primaryLight: "#fef3c7",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#fffbeb",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#1a1608",
      card: "#292213",
      primary: "#fbbf24",
      primaryLight: "#92400e",
      border: "#3d3518",
      borderLight: "#4d4322",
      iconBackground: "#3b3010",
      headerBackground: "#292213",
    },
  },
  {
    id: "orchid",
    preview: "#7c3aed",
    light: {
      ...BASE_LIGHT,
      background: "#faf8ff",
      card: "#ffffff",
      primary: "#7c3aed",
      primaryLight: "#ede9fe",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#f5f3ff",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#130f1e",
      card: "#1e1830",
      primary: "#a78bfa",
      primaryLight: "#5b21b6",
      border: "#2e2548",
      borderLight: "#3b3058",
      iconBackground: "#271e45",
      headerBackground: "#1e1830",
    },
  },
  {
    id: "rose",
    preview: "#e11d48",
    light: {
      ...BASE_LIGHT,
      background: "#fff5f7",
      card: "#ffffff",
      primary: "#e11d48",
      primaryLight: "#ffe4e6",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#fff1f2",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#1a0d12",
      card: "#29141c",
      primary: "#fb7185",
      primaryLight: "#9f1239",
      border: "#3f1d2a",
      borderLight: "#4d2535",
      iconBackground: "#3b1525",
      headerBackground: "#29141c",
    },
  },
  {
    id: "sienna",
    preview: "#92400e",
    light: {
      ...BASE_LIGHT,
      background: "#fdfaf6",
      card: "#ffffff",
      primary: "#92400e",
      primaryLight: "#fde8cd",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#fdf4e8",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#1a1410",
      card: "#291f18",
      primary: "#d4915c",
      primaryLight: "#6b3410",
      border: "#3d3020",
      borderLight: "#4d3d2a",
      iconBackground: "#3b2a18",
      headerBackground: "#291f18",
    },
  },
  {
    id: "teal",
    preview: "#0d9488",
    light: {
      ...BASE_LIGHT,
      background: "#f6fdfc",
      card: "#ffffff",
      primary: "#0d9488",
      primaryLight: "#ccfbf1",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#f0fdfa",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#0c1a18",
      card: "#142623",
      primary: "#2dd4bf",
      primaryLight: "#115e59",
      border: "#1f3d38",
      borderLight: "#2a4d48",
      iconBackground: "#1a3a35",
      headerBackground: "#142623",
    },
  },
  {
    id: "slate",
    preview: "#475569",
    light: {
      ...BASE_LIGHT,
      background: "#f8fafc",
      card: "#ffffff",
      primary: "#475569",
      primaryLight: "#e2e8f0",
      border: "#cbd5e1",
      borderLight: "#e2e8f0",
      iconBackground: "#f1f5f9",
      headerBackground: "#94a3b8",
    },
    dark: {
      ...BASE_DARK,
      background: "#0f172a",
      card: "#1e293b",
      primary: "#94a3b8",
      primaryLight: "#334155",
      border: "#334151",
      borderLight: "#475569",
      iconBackground: "#1e293b",
      headerBackground: "#1e293b",
    },
  },
  {
    id: "tangerine",
    preview: "#ea580c",
    light: {
      ...BASE_LIGHT,
      background: "#fffaf5",
      card: "#ffffff",
      primary: "#ea580c",
      primaryLight: "#ffedd5",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#fff7ed",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#1a1208",
      card: "#291d13",
      primary: "#fb923c",
      primaryLight: "#9a3412",
      border: "#3d2e18",
      borderLight: "#4d3b22",
      iconBackground: "#3b2810",
      headerBackground: "#291d13",
    },
  },
  {
    id: "indigo",
    preview: "#4338ca",
    light: {
      ...BASE_LIGHT,
      background: "#f8f8ff",
      card: "#ffffff",
      primary: "#4338ca",
      primaryLight: "#e0e7ff",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#eef2ff",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#100f20",
      card: "#1a1833",
      primary: "#818cf8",
      primaryLight: "#3730a3",
      border: "#28254a",
      borderLight: "#35305a",
      iconBackground: "#222050",
      headerBackground: "#1a1833",
    },
  },
  {
    id: "sage",
    preview: "#4d7c0f",
    light: {
      ...BASE_LIGHT,
      background: "#fafdf5",
      card: "#ffffff",
      primary: "#4d7c0f",
      primaryLight: "#ecfccb",
      border: "#d1d5db",
      borderLight: "#e5e7eb",
      iconBackground: "#f7fde8",
      headerBackground: "#9ca3af",
    },
    dark: {
      ...BASE_DARK,
      background: "#121a0c",
      card: "#1c2814",
      primary: "#a3e635",
      primaryLight: "#365314",
      border: "#2a3d18",
      borderLight: "#354d22",
      iconBackground: "#253a12",
      headerBackground: "#1c2814",
    },
  },
];

export const DEFAULT_PALETTE_ID = "cobalt";

export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getPaletteById(id: string): ColorPalette {
  return (
    COLOR_PALETTES.find((p) => p.id === id) ||
    COLOR_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!
  );
}
