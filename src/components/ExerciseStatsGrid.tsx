import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { SvgIcon } from "./SvgIcons";

export interface ExerciseStatItem {
  name: string;
  iconName: string;
  iconFamily: string;
  totalSets: number;
  totalReps: number;
  totalTime: number;
  daysPerformed: number;
}

interface ExerciseStatsGridProps {
  exercises: ExerciseStatItem[];
  formatTime: (seconds: number) => string;
}

const iconFamilies = {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
};

const { width } = Dimensions.get("window");
const CARD_GAP = 8;
const CARD_WIDTH = (width - 32 - 32 - CARD_GAP) / 2; // screen padding + card padding + gap

export default function ExerciseStatsGrid({
  exercises,
  formatTime,
}: ExerciseStatsGridProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const getIconComponent = (family: string, name: string) => {
    if (family === "image") {
      return <SvgIcon name={name} color={theme.primary} size={32} />;
    }
    const IconFamily =
      iconFamilies[family as keyof typeof iconFamilies] || Ionicons;
    return <IconFamily name={name as any} size={32} color={theme.primary} />;
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.grid}>
      {exercises.map((ex, index) => {
        const avgSets =
          ex.daysPerformed > 0
            ? (ex.totalSets / ex.daysPerformed).toFixed(1)
            : "0";
        const avgReps =
          ex.daysPerformed > 0
            ? (ex.totalReps / ex.daysPerformed).toFixed(0)
            : "0";
        const avgTime =
          ex.daysPerformed > 0
            ? Math.round(ex.totalTime / ex.daysPerformed)
            : 0;

        return (
          <View key={index} style={styles.card}>
            <View style={styles.iconContainer}>
              {getIconComponent(ex.iconFamily, ex.iconName)}
            </View>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {ex.name}
            </Text>
            <View style={styles.statsContainer}>
              {ex.totalSets > 0 && (
                <>
                  <Text style={styles.statText}>
                    {t("weekly.totalSets")}: {ex.totalSets}
                  </Text>
                  <Text style={styles.statText}>
                    {t("monthly.averageSets")}: {avgSets}
                  </Text>
                </>
              )}
              {ex.totalReps > 0 && (
                <>
                  <Text style={styles.statText}>
                    {t("weekly.totalReps")}: {ex.totalReps}
                  </Text>
                  <Text style={styles.statText}>
                    {t("monthly.averageReps")}: {avgReps}
                  </Text>
                </>
              )}
              {ex.totalTime > 0 && (
                <>
                  <Text style={styles.statText}>
                    {t("weekly.totalTime")}: {formatTime(ex.totalTime)}
                  </Text>
                  <Text style={styles.statText}>
                    {t("monthly.averageTime")}: {formatTime(avgTime)}
                  </Text>
                </>
              )}
              <Text style={styles.statText}>
                {t("monthly.daysPerformed")}: {ex.daysPerformed}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: CARD_GAP,
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 16,
      paddingBottom: 28,
      alignItems: "center",
    },
    iconContainer: {
      width: 54,
      height: 54,
      backgroundColor: theme.iconBackground,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    exerciseName: {
      fontWeight: "600",
      color: theme.text,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 24,
    },
    statsContainer: {
      alignItems: "center",
      gap: 16,
    },
    statText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
    },
  });
