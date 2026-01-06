import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomHeader from "../components/CustomHeader";
import { useTheme } from "../contexts/ThemeContext";
import { getDatabase } from "../database/init";
import { useUserStore } from "../store/userStore";
import {
  BodyRecord,
  DailyCompletion,
  DailySnapshot,
  ExportData,
  UserInfo,
  WeeklyPlanExercise,
} from "../types";
import BodyStatisticsScreen from "./BodyStatisticsScreen";
import LongTermStatsScreen from "./LongTermStatsScreen";
import RecordDetailScreen from "./RecordDetailScreen";

const Stack = createNativeStackNavigator();

function SettingsMain({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { userInfo, resetUserData, updateLanguage } = useUserStore();
  const { theme, isDark, toggleTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = async (language: string) => {
    try {
      await updateLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error("Error changing language:", error);
      Alert.alert(t("common.error"), "Failed to change language");
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const db = getDatabase();

      const userInfo = await db.getAllAsync<UserInfo>(
        "SELECT * FROM user_info"
      );
      const bodyRecords = await db.getAllAsync<BodyRecord>(
        "SELECT * FROM body_records"
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
        version: "2.0",
        exported_at: new Date().toISOString(),
        user_info: userInfo,
        body_records: bodyRecords,
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
        Alert.alert(t("settings.success"), t("settings.dataExported"));
      }
    } catch (error) {
      Alert.alert(t("settings.error"), t("settings.exportError"));
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
        Alert.alert(t("common.error"), t("settings.invalidBackup"));
        setIsImporting(false);
        return;
      }

      Alert.alert(t("settings.importConfirm"), t("settings.importMessage"), [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => setIsImporting(false),
        },
        {
          text: t("settings.import"),
          style: "destructive",
          onPress: async () => {
            await performImport(importData);
            setIsImporting(false);
          },
        },
      ]);
    } catch (error) {
      Alert.alert(t("common.error"), t("settings.importError"));
      console.error(error);
      setIsImporting(false);
    }
  };

  const performImport = async (data: ExportData) => {
    const db = getDatabase();

    await db.execAsync(`
      DELETE FROM user_info;
      DELETE FROM body_records;
      DELETE FROM weekly_plan;
      DELETE FROM daily_snapshot;
      DELETE FROM daily_completion;
    `);

    for (const user of data.user_info) {
      await db.runAsync(
        "INSERT INTO user_info (full_name, birthday, gender, created_at, language, theme) VALUES (?, ?, ?, ?, ?, ?)",
        [
          user.full_name,
          user.birthday,
          user.gender,
          user.created_at,
          user.language || "en",
          user.theme || "light",
        ]
      );
    }

    if (data.body_records) {
      for (const record of data.body_records) {
        await db.runAsync(
          "INSERT INTO body_records (user_id, date, weight, height, neck_perimeter, waist_perimeter, hip_perimeter, bicep_perimeter, thigh_perimeter, calf_perimeter, shoulder_perimeter, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            record.user_id,
            record.date,
            record.weight,
            record.height,
            record.neck_perimeter ?? null,
            record.waist_perimeter ?? null,
            record.hip_perimeter ?? null,
            record.bicep_perimeter ?? null,
            record.thigh_perimeter ?? null,
            record.calf_perimeter ?? null,
            record.shoulder_perimeter ?? null,
            record.created_at,
          ]
        );
      }
    }

    for (const plan of data.weekly_plan) {
      await db.runAsync(
        "INSERT INTO weekly_plan (day_of_week, exercise_name, icon_name, icon_family, sets, reps, estimated_time, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          plan.day_of_week,
          plan.exercise_name,
          plan.icon_name,
          plan.icon_family,
          plan.sets ?? null,
          plan.reps ?? null,
          plan.estimated_time ?? null,
          plan.sort_order,
        ]
      );
    }

    for (const snapshot of data.daily_snapshots) {
      await db.runAsync(
        "INSERT INTO daily_snapshot (date, exercise_name, icon_name, icon_family, sets, reps, estimated_time, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          snapshot.date,
          snapshot.exercise_name,
          snapshot.icon_name,
          snapshot.icon_family,
          snapshot.sets ?? null,
          snapshot.reps ?? null,
          snapshot.estimated_time ?? null,
          snapshot.sort_order,
        ]
      );
    }

    for (const completion of data.daily_completions) {
      await db.runAsync(
        "INSERT INTO daily_completion (date, is_completed, completed_at, training_time) VALUES (?, ?, ?, ?)",
        [
          completion.date,
          completion.is_completed ? 1 : 0,
          completion.completed_at ?? null,
          completion.training_time || 0,
        ]
      );
    }

    Alert.alert(t("settings.success"), t("settings.dataImported"));
  };

  const handleReset = () => {
    Alert.alert(t("settings.resetConfirm"), t("settings.resetMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.deleteAllData"),
        style: "destructive",
        onPress: async () => {
          try {
            await resetUserData();
            Alert.alert(t("settings.success"), t("settings.allDataDeleted"));
          } catch (error) {
            console.error("Error resetting app:", error);
            Alert.alert(t("settings.error"), t("settings.resetError"));
          }
        },
      },
    ]);
  };

  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.userProfile")}</Text>

        {userInfo && (
          <View style={styles.profileContainer}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>{t("settings.name")}</Text>
              <Text style={styles.profileValue}>{userInfo.full_name}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>{t("settings.age")}</Text>
              <Text style={styles.profileValue}>
                {calculateAge(userInfo.birthday)}
              </Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>{t("settings.gender")}</Text>
              <Text style={styles.profileValue}>
                {userInfo.gender === "male"
                  ? t("intro.male")
                  : t("intro.female")}
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.bodyStatsButton}
        onPress={() => navigation.navigate("BodyStatistics")}
      >
        <Ionicons name="body-outline" size={24} color="#fff" />
        <Text style={styles.bodyStatsButtonText}>
          {t("bodyStats.myPersonalStats")}
        </Text>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.preferences")}</Text>

        <View style={styles.preferenceSection}>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>{t("settings.language")}</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currentLanguage}
              onValueChange={handleLanguageChange}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label={t("settings.languageEnglish")} value="en" />
              <Picker.Item label={t("settings.languageSpanish")} value="es" />
            </Picker>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.preferenceRow}>
          <View>
            <Text style={styles.preferenceLabel}>{t("settings.theme")}</Text>
            <Text style={styles.preferenceSubLabel}>
              {isDark ? t("settings.darkMode") : t("settings.lightMode")}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.borderLight, true: theme.primary }}
            thumbColor={isDark ? theme.primaryLight : theme.card}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.dataManagement")}</Text>

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
              <Text style={styles.exportButtonText}>
                {t("settings.exportData")}
              </Text>
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
              <Text style={styles.importButtonText}>
                {t("settings.importData")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.infoText}>{t("settings.exportInfo")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.dangerZone")}</Text>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.resetButtonText}>{t("settings.resetApp")}</Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>{t("settings.resetWarning")}</Text>
      </View>
    </ScrollView>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: "center",
        contentStyle: {
          backgroundColor: theme.background,
        },
        animation: "none",
        presentation: "card",
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsMain}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BodyStatistics"
        component={BodyStatisticsScreen}
        options={{
          title: t("bodyStats.myPersonalStats"),
          header: () => <CustomHeader title={t("bodyStats.myPersonalStats")} />,
        }}
      />
      <Stack.Screen
        name="LongTermStats"
        component={LongTermStatsScreen}
        options={{
          title: t("bodyStats.longTermStats"),
          header: () => <CustomHeader title={t("bodyStats.longTermStats")} />,
        }}
      />
      <Stack.Screen
        name="RecordDetail"
        component={RecordDetailScreen}
        options={{
          title: t("bodyStats.recordDetail"),
          header: () => <CustomHeader title={t("bodyStats.recordDetail")} />,
        }}
      />
    </Stack.Navigator>
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
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
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
      color: theme.textSecondary,
    },
    profileValue: {
      fontWeight: "600",
      color: theme.text,
    },
    bodyStatsButton: {
      backgroundColor: theme.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    bodyStatsButtonText: {
      flex: 1,
      marginLeft: 12,
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    preferenceSection: {
      marginBottom: 16,
    },
    preferenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    preferenceLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.text,
    },
    preferenceSubLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      marginTop: 8,
      backgroundColor: theme.borderLight,
    },
    picker: {
      color: theme.text,
    },
    pickerItem: {
      color: theme.text,
    },
    exportButton: {
      backgroundColor: theme.primary,
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
      backgroundColor: theme.success,
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
      borderTopColor: theme.borderLight,
      paddingTop: 16,
      marginTop: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    resetButton: {
      backgroundColor: theme.errorDark,
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
      color: theme.textSecondary,
      marginTop: 12,
    },
  });
