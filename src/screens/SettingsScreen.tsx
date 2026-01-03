import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getDatabase } from "../database/init";
import { useUserStore } from "../store/userStore";
import {
  DailyCompletion,
  DailySnapshot,
  ExportData,
  UserInfo,
  WeeklyPlanExercise,
} from "../types";

export default function SettingsScreen() {
  const { userInfo, resetUserData } = useUserStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const db = getDatabase();

      const user = await db.getFirstAsync<UserInfo>(
        "SELECT * FROM user_info ORDER BY id DESC LIMIT 1"
      );
      const weeklyPlan = await db.getAllAsync<WeeklyPlanExercise>(
        "SELECT * FROM weekly_plan"
      );
      const dailySnapshots = await db.getAllAsync<DailySnapshot>(
        "SELECT * FROM daily_snapshot"
      );
      const dailyCompletions = await db.getAllAsync<DailyCompletion>(
        "SELECT * FROM daily_completion"
      );

      const exportData: ExportData = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        user_info: user || null,
        weekly_plan: weeklyPlan,
        daily_snapshots: dailySnapshots,
        daily_completions: dailyCompletions,
      };

      const filename = `exercise_tracker_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      const filePath = `${FileSystem.documentDirectory ?? ""}${filename}`;

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(exportData, null, 2)
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert("Success", `Data exported to ${filePath}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(
        result.assets[0].uri
      );
      const importData: ExportData = JSON.parse(fileContent);

      if (!importData.version) {
        Alert.alert("Error", "Invalid backup file");
        setIsImporting(false);
        return;
      }

      Alert.alert(
        "Confirm Import",
        "This will replace all existing data. Continue?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsImporting(false),
          },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              await performImport(importData);
              setIsImporting(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to import data");
      console.error(error);
      setIsImporting(false);
    }
  };

  const performImport = async (data: ExportData) => {
    const db = getDatabase();

    await db.execAsync(`
      DELETE FROM user_info;
      DELETE FROM weekly_plan;
      DELETE FROM daily_snapshot;
      DELETE FROM daily_completion;
    `);

    if (data.user_info) {
      await db.runAsync(
        "INSERT INTO user_info (full_name, age, height, weight, created_at) VALUES (?, ?, ?, ?, ?)",
        [
          data.user_info.full_name,
          data.user_info.age,
          data.user_info.height,
          data.user_info.weight,
          data.user_info.created_at,
        ]
      );
    }

    for (const plan of data.weekly_plan) {
      await db.runAsync(
        "INSERT INTO weekly_plan (day_of_week, exercise_name, icon_name, icon_family, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          plan.day_of_week,
          plan.exercise_name,
          plan.icon_name,
          plan.icon_family,
          plan.sets,
          plan.reps,
          plan.sort_order,
        ]
      );
    }

    for (const snapshot of data.daily_snapshots) {
      await db.runAsync(
        "INSERT INTO daily_snapshot (date, exercise_name, icon_name, icon_family, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          snapshot.date,
          snapshot.exercise_name,
          snapshot.icon_name,
          snapshot.icon_family,
          snapshot.sets,
          snapshot.reps,
          snapshot.sort_order,
        ]
      );
    }

    for (const completion of data.daily_completions) {
      await db.runAsync(
        "INSERT INTO daily_completion (date, is_completed, completed_at, elapsed_seconds) VALUES (?, ?, ?, ?)",
        [
          completion.date,
          completion.is_completed ? 1 : 0,
          completion.completed_at ?? null,
          completion.elapsed_seconds,
        ]
      );
    }

    Alert.alert(
      "Success",
      "Data imported successfully. Please restart the app."
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App",
      "This will permanently delete all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All Data",
          style: "destructive",
          onPress: async () => {
            await resetUserData();
            Alert.alert(
              "Success",
              "All data has been deleted. The app will restart."
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>User Profile</Text>

        {userInfo && (
          <View style={styles.profileContainer}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Name</Text>
              <Text style={styles.profileValue}>{userInfo.full_name}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Age</Text>
              <Text style={styles.profileValue}>{userInfo.age}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Height</Text>
              <Text style={styles.profileValue}>{userInfo.height} cm</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Weight</Text>
              <Text style={styles.profileValue}>{userInfo.weight} kg</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Export Data</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.importButtonText}>Import Data</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.infoText}>
          Export your data to backup or transfer to another device. Import to
          restore from a previous backup.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Danger Zone</Text>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.resetButtonText}>
            Reset App & Delete All Data
          </Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          This will permanently delete all your data including user profile,
          exercises, and training history. This action cannot be undone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  profileContainer: {
    gap: 8,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileLabel: {
    color: "#6b7280",
  },
  profileValue: {
    fontWeight: "600",
    color: "#111827",
  },
  exportButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  importButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  importButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  resetButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
});
