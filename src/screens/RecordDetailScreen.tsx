import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EditRecordModal from "../components/EditRecordModal";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";
import { useUserStore } from "../store/userStore";
import { BodyRecord } from "../types";

export default function RecordDetailScreen({ route, navigation }: any) {
  const { recordId } = route.params;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { getRecordById, deleteRecord } = useBodyRecordsStore();
  const { userInfo } = useUserStore();
  const [record, setRecord] = useState<BodyRecord | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

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

    if (isFemale && !record.hip_perimeter) return null;

    let bodyFat: number;

    if (isFemale && record.hip_perimeter) {
      bodyFat =
        495 /
          (1.29579 -
            0.35004 *
              Math.log10(
                record.waist_perimeter +
                  record.hip_perimeter -
                  record.neck_perimeter,
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

  const BMIRangeIndicator = ({ bmi }: { bmi: number }) => {
    const ranges = [
      {
        min: 0,
        max: 18.5,
        label: t("bodyStats.underweight"),
        color: theme.primary,
      },
      {
        min: 18.5,
        max: 25,
        label: t("bodyStats.normal"),
        color: theme.success,
      },
      { min: 25, max: 30, label: t("bodyStats.overweight"), color: "#f59e0b" },
      { min: 30, max: 50, label: t("bodyStats.obese"), color: theme.error },
    ];

    const totalRange = 50;
    const getPosition = (value: number) =>
      ((value / totalRange) * 100).toFixed(1);

    return (
      <View style={styles.rangeContainer}>
        <View style={styles.rangeBar}>
          {ranges.map((range, index) => (
            <View
              key={index}
              style={[
                styles.rangeSegment,
                {
                  flex: range.max - range.min,
                  backgroundColor: range.color + "40",
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={styles.rangeLabel}>{range.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.rangeMarkers}>
          <View
            style={[
              styles.currentMarker,
              {
                left: `${(
                  (Math.min(bmi, totalRange) / totalRange) *
                  100
                ).toFixed(1)}%` as any,
              },
            ]}
          >
            <View
              style={[styles.markerDot, { backgroundColor: theme.error }]}
            />
            <Text style={styles.markerText}>{bmi.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.rangeValues}>
          <Text style={styles.rangeValueText}>0</Text>
          <Text style={styles.rangeValueText}>18.5</Text>
          <Text style={styles.rangeValueText}>25</Text>
          <Text style={styles.rangeValueText}>30</Text>
          <Text style={styles.rangeValueText}>50+</Text>
        </View>
      </View>
    );
  };

  const BodyFatRangeIndicator = ({ bodyFat }: { bodyFat: number }) => {
    const isFemale = userInfo?.gender === "female";
    const ranges = isFemale
      ? [
          {
            min: 0,
            max: 14,
            label: t("bodyStats.essential"),
            color: theme.primary,
          },
          {
            min: 14,
            max: 21,
            label: t("bodyStats.athletes"),
            color: theme.success,
          },
          {
            min: 21,
            max: 25,
            label: t("bodyStats.fitness"),
            color: theme.success,
          },
          { min: 25, max: 32, label: t("bodyStats.average"), color: "#f59e0b" },
          { min: 32, max: 50, label: t("bodyStats.obese"), color: theme.error },
        ]
      : [
          {
            min: 0,
            max: 6,
            label: t("bodyStats.essential"),
            color: theme.primary,
          },
          {
            min: 6,
            max: 14,
            label: t("bodyStats.athletes"),
            color: theme.success,
          },
          {
            min: 14,
            max: 18,
            label: t("bodyStats.fitness"),
            color: theme.success,
          },
          { min: 18, max: 25, label: t("bodyStats.average"), color: "#f59e0b" },
          { min: 25, max: 50, label: t("bodyStats.obese"), color: theme.error },
        ];

    const totalRange = 50;
    const getPosition = (value: number) =>
      ((value / totalRange) * 100).toFixed(1);

    return (
      <View style={styles.rangeContainer}>
        <View style={styles.rangeBar}>
          {ranges.map((range, index) => (
            <View
              key={index}
              style={[
                styles.rangeSegment,
                {
                  flex: range.max - range.min,
                  backgroundColor: range.color + "40",
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={styles.rangeLabel}>{range.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.rangeMarkers}>
          <View
            style={[
              styles.currentMarker,
              {
                left: `${getPosition(Math.min(bodyFat, totalRange))}%` as any,
              },
            ]}
          >
            <View
              style={[styles.markerDot, { backgroundColor: theme.error }]}
            />
            <Text style={styles.markerText}>{bodyFat.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  if (!record) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const isFemale = userInfo?.gender === "female";
  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);

  const canCalculateBodyFat = isFemale
    ? !!(
        record.neck_perimeter &&
        record.waist_perimeter &&
        record.hip_perimeter
      )
    : !!(record.neck_perimeter && record.waist_perimeter);

  const bodyFat = calculateBodyFat();
  const bodyFatValid =
    canCalculateBodyFat && bodyFat !== null && !isNaN(bodyFat);
  const bodyFatInfo = bodyFatValid ? getBodyFatCategory(bodyFat!) : null;

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
          {record.bicep_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.bicepPerimeter")}
              </Text>
              <Text style={styles.dataValue}>{record.bicep_perimeter} cm</Text>
            </View>
          )}
          {record.thigh_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.thighPerimeter")}
              </Text>
              <Text style={styles.dataValue}>{record.thigh_perimeter} cm</Text>
            </View>
          )}
          {record.calf_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.calfPerimeter")}
              </Text>
              <Text style={styles.dataValue}>{record.calf_perimeter} cm</Text>
            </View>
          )}
          {record.shoulder_perimeter && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t("bodyStats.shoulderPerimeter")}
              </Text>
              <Text style={styles.dataValue}>
                {record.shoulder_perimeter} cm
              </Text>
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
          <BMIRangeIndicator bmi={bmi} />
          <Text style={styles.infoText}>{t("bodyStats.bmiInfo")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("bodyStats.bodyFat")}</Text>
          {!canCalculateBodyFat ? (
            <View style={styles.missingInfoRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={theme.textSecondary}
                style={styles.missingInfoIcon}
              />
              <Text style={styles.missingInfoText}>
                {isFemale
                  ? t("bodyStats.bodyFatMissingFemale")
                  : t("bodyStats.bodyFatMissingMale")}
              </Text>
            </View>
          ) : bodyFatValid && bodyFatInfo ? (
            <>
              <View style={styles.statisticHeader}>
                <Text style={styles.statisticValue}>{bodyFat!.toFixed(1)}%</Text>
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
              <BodyFatRangeIndicator bodyFat={bodyFat!} />
              <Text style={styles.infoText}>{t("bodyStats.bodyFatInfo")}</Text>
            </>
          ) : (
            <View style={styles.missingInfoRow}>
              <Ionicons
                name="warning-outline"
                size={18}
                color={theme.textSecondary}
                style={styles.missingInfoIcon}
              />
              <Text style={styles.missingInfoText}>
                {t("bodyStats.bodyFatInvalidMeasurements")}
              </Text>
            </View>
          )}
        </View>

        {!!(
          record.bicep_perimeter ||
          record.thigh_perimeter ||
          record.calf_perimeter ||
          record.shoulder_perimeter
        ) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("bodyStats.muscleMass")}</Text>
            <Text style={styles.infoText}>{t("bodyStats.muscleMassInfo")}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("bodyStats.recommendations")}</Text>
          <Text style={styles.suggestionText}>
            {t("bodyStats.measurementRecommendations")}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("bodyStats.suggestions")}</Text>
          <Text style={styles.suggestionText}>
            {bmi < 18.5 && t("bodyStats.suggestionUnderweight")}
            {bmi >= 18.5 && bmi < 25 && t("bodyStats.suggestionNormal")}
            {bmi >= 25 && bmi < 30 && t("bodyStats.suggestionOverweight")}
            {bmi >= 30 && t("bodyStats.suggestionObese")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editButtonText}>{t("bodyStats.editRecord")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>
            {t("bodyStats.deleteRecord")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <EditRecordModal
        visible={editModalVisible}
        record={record}
        onClose={() => setEditModalVisible(false)}
        onSaved={loadRecord}
      />
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
      paddingBottom: 32,
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
    rangeContainer: {
      marginVertical: 16,
    },
    rangeBar: {
      flexDirection: "row",
      height: 40,
      borderRadius: 8,
      overflow: "hidden",
    },
    rangeSegment: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    rangeLabel: {
      fontSize: 10,
      color: theme.text,
      textAlign: "center",
      fontWeight: "500",
    },
    rangeMarkers: {
      position: "relative",
      height: 40,
      marginTop: 8,
    },
    currentMarker: {
      position: "absolute",
      alignItems: "center",
      marginLeft: -12,
    },
    markerDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    markerText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.text,
    },
    rangeValues: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    rangeValueText: {
      fontSize: 10,
      color: theme.textSecondary,
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
    missingInfoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 4,
    },
    missingInfoIcon: {
      marginTop: 1,
    },
    missingInfoText: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 12,
      gap: 8,
    },
    editButtonIcon: {
      marginRight: 2,
    },
    editButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
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
