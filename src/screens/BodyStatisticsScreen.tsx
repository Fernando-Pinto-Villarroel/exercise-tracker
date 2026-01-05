import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";

export default function BodyStatisticsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { records, loadRecords } = useBodyRecordsStore();

  useFocusEffect(
    React.useCallback(() => {
      loadRecords();
    }, [])
  );

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="body-outline"
              size={64}
              color={theme.textTertiary}
            />
            <Text style={styles.emptyText}>{t("bodyStats.noRecords")}</Text>
            <Text style={styles.emptySubtext}>
              {t("bodyStats.addRecordsHint")}
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {records.map((record) => (
              <TouchableOpacity
                key={record.id}
                style={styles.recordCard}
                onPress={() =>
                  navigation.navigate("RecordDetail", { recordId: record.id })
                }
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{record.date}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
                <View style={styles.recordData}>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>
                      {t("bodyStats.weight")}
                    </Text>
                    <Text style={styles.dataValue}>{record.weight} kg</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>
                      {t("bodyStats.height")}
                    </Text>
                    <Text style={styles.dataValue}>{record.height} cm</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddRecord")}
        >
          <Text style={styles.addButtonText}>{t("bodyStats.addRecord")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 18,
      marginTop: 16,
    },
    emptySubtext: {
      color: theme.textTertiary,
      fontSize: 14,
      marginTop: 8,
    },
    recordsList: {
      gap: 12,
      marginBottom: 16,
    },
    recordCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    recordHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    recordDate: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    recordData: {
      flexDirection: "row",
      gap: 16,
    },
    dataItem: {
      flex: 1,
    },
    dataLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    dataValue: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.text,
    },
    addButton: {
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    addButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
