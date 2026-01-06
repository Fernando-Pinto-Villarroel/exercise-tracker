import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";
import { BodyRecord } from "../types";

const { width } = Dimensions.get("window");

export default function LongTermStatsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { records, loadRecords } = useBodyRecordsStore();
  const [sortedRecords, setSortedRecords] = useState<BodyRecord[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setSortedRecords(sorted);
  }, [records]);

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
    strokeWidth: 2,
    propsForLabels: {
      fontSize: 10,
    },
    propsForDots: {
      r: "4",
    },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const createChartData = (field: keyof BodyRecord) => {
    if (sortedRecords.length === 0) return null;

    const validRecords = sortedRecords.filter(
      (r) => r[field] !== null && r[field] !== undefined
    );

    if (validRecords.length === 0) return null;

    const maxPoints = 10;
    const step = Math.max(1, Math.floor(validRecords.length / maxPoints));
    const sampledRecords = validRecords.filter((_, i) => i % step === 0);

    if (sampledRecords.length < validRecords.length - 1) {
      sampledRecords.push(validRecords[validRecords.length - 1]);
    }

    return {
      labels: sampledRecords.map((r) => formatDate(r.date)),
      datasets: [
        {
          data: sampledRecords.map((r) => Number(r[field])),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const weightData = createChartData("weight");
  const heightData = createChartData("height");
  const neckData = createChartData("neck_perimeter");
  const waistData = createChartData("waist_perimeter");
  const hipData = createChartData("hip_perimeter");
  const bicepData = createChartData("bicep_perimeter");
  const thighData = createChartData("thigh_perimeter");
  const calfData = createChartData("calf_perimeter");
  const shoulderData = createChartData("shoulder_perimeter");

  const styles = createStyles(theme);

  if (sortedRecords.length < 2) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t("bodyStats.noDataForCharts")}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {weightData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("bodyStats.weightProgress")}
            </Text>
            <LineChart
              data={weightData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" kg"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {heightData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("bodyStats.heightProgress")}
            </Text>
            <LineChart
              data={heightData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {neckData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("bodyStats.neckPerimeter")}</Text>
            <LineChart
              data={neckData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {waistData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("bodyStats.waistPerimeter")}
            </Text>
            <LineChart
              data={waistData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {hipData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("bodyStats.hipPerimeter")}</Text>
            <LineChart
              data={hipData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {(bicepData || thighData || calfData || shoulderData) && (
          <Text style={styles.sectionTitle}>
            {t("bodyStats.muscleProgress")}
          </Text>
        )}

        {bicepData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("bodyStats.bicepPerimeter")}
            </Text>
            <LineChart
              data={bicepData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {thighData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("bodyStats.thighPerimeter")}
            </Text>
            <LineChart
              data={thighData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {calfData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("bodyStats.calfPerimeter")}</Text>
            <LineChart
              data={calfData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}

        {shoulderData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("bodyStats.shoulderPerimeter")}
            </Text>
            <LineChart
              data={shoulderData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" cm"
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        )}
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
      paddingBottom: 32,
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
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      paddingHorizontal: 32,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
    },
  });
