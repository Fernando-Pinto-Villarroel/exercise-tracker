import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";
import { useUserStore } from "../store/userStore";
import { BodyRecord } from "../types";

const { width } = Dimensions.get("window");

export default function RecordDetailScreen({ route, navigation }: any) {
  const { recordId } = route.params;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { getRecordById, deleteRecord } = useBodyRecordsStore();
  const { userInfo } = useUserStore();
  const [record, setRecord] = useState<BodyRecord | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    const data = await getRecordById(recordId);
    setRecord(data);
  };

  const calculateBMI = () => {
    if (!record) return 0;
    const heightInMeters = record.height / 100;
    return record.weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return { category: t("bodyStats.underweight"), color: theme.primary };
    if (bmi < 25)
      return { category: t("bodyStats.normal"), color: theme.success };
    if (bmi < 30)
      return { category: t("bodyStats.overweight"), color: "#f59e0b" };
    return { category: t("bodyStats.obese"), color: theme.error };
  };

  const calculateBodyFat = () => {
    if (!record || !record.neck_perimeter || !record.waist_perimeter)
      return null;

    const heightCm = record.height;
    const isFemale = userInfo?.gender === "female";

    let bodyFat: number;

    if (isFemale && record.hip_perimeter) {
      bodyFat =
        495 /
          (1.29579 -
            0.35004 *
              Math.log10(
                record.waist_perimeter +
                  record.hip_perimeter -
                  record.neck_perimeter
              ) +
            0.221 * Math.log10(heightCm)) -
        450;
    } else {
      bodyFat =
        495 /
          (1.0324 -
            0.19077 *
              Math.log10(record.waist_perimeter - record.neck_perimeter) +
            0.15456 * Math.log10(heightCm)) -
        450;
    }

    return Math.max(0, Math.min(100, bodyFat));
  };

  const getBodyFatCategory = (bodyFat: number) => {
    const isFemale = userInfo?.gender === "female";

    if (isFemale) {
      if (bodyFat < 14)
        return { category: t("bodyStats.essential"), color: theme.primary };
      if (bodyFat < 21)
        return { category: t("bodyStats.athletes"), color: theme.success };
      if (bodyFat < 25)
        return { category: t("bodyStats.fitness"), color: theme.success };
      if (bodyFat < 32)
        return { category: t("bodyStats.average"), color: "#f59e0b" };
      return { category: t("bodyStats.obese"), color: theme.error };
    } else {
      if (bodyFat < 6)
        return { category: t("bodyStats.essential"), color: theme.primary };
      if (bodyFat < 14)
        return { category: t("bodyStats.athletes"), color: theme.success };
      if (bodyFat < 18)
        return { category: t("bodyStats.fitness"), color: theme.success };
      if (bodyFat < 25)
        return { category: t("bodyStats.average"), color: "#f59e0b" };
      return { category: t("bodyStats.obese"), color: theme.error };
    }
  };

  const handleDelete = () => {
    Alert.alert(t("bodyStats.deleteRecord"), t("bodyStats.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteRecord(recordId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!record) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);
  const bodyFat = calculateBodyFat();
  const bodyFatInfo = bodyFat ? getBodyFatCategory(bodyFat) : null;

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  };

  const bmiData = [
    {
      name: t("bodyStats.underweight"),
      population: bmi < 18.5 ? 1 : 0,
      color: theme.primary,
      legendFontColor: theme.text,
    },
    {
      name: t("bodyStats.normal"),
      population: bmi >= 18.5 && bmi < 25 ? 1 : 0,
      color: theme.success,
      legendFontColor: theme.text,
    },
    {
      name: t("bodyStats.overweight"),
      population: bmi >= 25 && bmi < 30 ? 1 : 0,
      color: "#f59e0b",
      legendFontColor: theme.text,
    },
    {
      name: t("bodyStats.obese"),
      population: bmi >= 30 ? 1 : 0,
      color: theme.error,
      legendFontColor: theme.text,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("bodyStats.basicData")}</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{t("bodyStats.date")}</Text>
            <Text style={styles.dataValue}>{record.date}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{t("bodyStats.weight")}</Text>
            <Text style={styles.dataValue}>{record.weight} kg</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{t("bodyStats.height")}</Text>
            <Text style={styles.dataValue}>{record.height} cm</Text>
          </View>
          {record.neck_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.neckPerimeter")}
              </Text>
              <Text style={styles.dataValue}>{record.neck_perimeter} cm</Text>
            </View>
          )}
          {record.waist_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.waistPerimeter")}
              </Text>
              <Text style={styles.dataValue}>{record.waist_perimeter} cm</Text>
            </View>
          )}
          {record.hip_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.hipPerimeter")}
              </Text>
              <Text style={styles.dataValue}>{record.hip_perimeter} cm</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("bodyStats.bmi")}</Text>
          <View style={styles.statisticHeader}>
            <Text style={styles.statisticValue}>{bmi.toFixed(1)}</Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: bmiInfo.color + "20" },
              ]}
            >
              <Text style={[styles.categoryText, { color: bmiInfo.color }]}>
                {bmiInfo.category}
              </Text>
            </View>
          </View>
          <PieChart
            data={bmiData}
            width={width - 64}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <Text style={styles.infoText}>{t("bodyStats.bmiInfo")}</Text>
        </View>

        {bodyFat && bodyFatInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("bodyStats.bodyFat")}</Text>
            <View style={styles.statisticHeader}>
              <Text style={styles.statisticValue}>{bodyFat.toFixed(1)}%</Text>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: bodyFatInfo.color + "20" },
                ]}
              >
                <Text
                  style={[styles.categoryText, { color: bodyFatInfo.color }]}
                >
                  {bodyFatInfo.category}
                </Text>
              </View>
            </View>
            <Text style={styles.infoText}>{t("bodyStats.bodyFatInfo")}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("bodyStats.suggestions")}</Text>
          <Text style={styles.suggestionText}>
            {bmi < 18.5 && t("bodyStats.suggestionUnderweight")}
            {bmi >= 18.5 && bmi < 25 && t("bodyStats.suggestionNormal")}
            {bmi >= 25 && bmi < 30 && t("bodyStats.suggestionOverweight")}
            {bmi >= 30 && t("bodyStats.suggestionObese")}
          </Text>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>
            {t("bodyStats.deleteRecord")}
          </Text>
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
    loadingText: {
      textAlign: "center",
      marginTop: 100,
      fontSize: 16,
      color: theme.textSecondary,
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
    dataRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    dataLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    dataValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    statisticHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    statisticValue: {
      fontSize: 36,
      fontWeight: "bold",
      color: theme.text,
    },
    categoryBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: "600",
    },
    infoText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 16,
      lineHeight: 20,
    },
    suggestionText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 22,
    },
    deleteButton: {
      backgroundColor: theme.errorDark,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    deleteButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
