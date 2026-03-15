import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { COLOR_PALETTES } from "../themes/palettes";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

export default function ColorPaletteScreen() {
  const { t } = useTranslation();
  const { theme, isDark, paletteId, setColorPalette } = useTheme();

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        {t("colorPalette.description")}
      </Text>

      <View style={styles.grid}>
        {COLOR_PALETTES.map((palette) => {
          const isSelected = palette.id === paletteId;
          const previewTheme = isDark ? palette.dark : palette.light;

          return (
            <TouchableOpacity
              key={palette.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setColorPalette(palette.id)}
              activeOpacity={0.7}
            >
              <View style={styles.previewRow}>
                <View
                  style={[
                    styles.previewCircle,
                    { backgroundColor: previewTheme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.previewCircleSmall,
                    { backgroundColor: previewTheme.primaryLight },
                  ]}
                />
                <View
                  style={[
                    styles.previewCircleSmall,
                    { backgroundColor: previewTheme.background },
                    { borderWidth: 1, borderColor: previewTheme.border },
                  ]}
                />
              </View>

              <Text style={[styles.paletteName, isSelected && styles.paletteNameSelected]}>
                {t(`colorPalette.palettes.${palette.id}`)}
              </Text>

              {isSelected && (
                <View style={styles.checkContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.primary}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
      fontSize: 15,
      color: theme.textSecondary,
      marginBottom: 20,
      lineHeight: 22,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: CARD_GAP,
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    cardSelected: {
      borderColor: theme.primary,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    previewCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    previewCircleSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    paletteName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      textAlign: "center",
    },
    paletteNameSelected: {
      color: theme.primary,
    },
    checkContainer: {
      position: "absolute",
      top: 8,
      right: 8,
    },
  });
