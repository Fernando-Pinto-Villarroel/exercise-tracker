import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddRecordModal from "../components/AddRecordModal";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";
import { BodyRecord } from "../types";

export default function BodyStatisticsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { records, hasMore, loadRecords, loadMoreRecords } =
    useBodyRecordsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, []),
  );

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadMoreRecords();
    setLoadingMore(false);
  };

  const renderRecord = ({ item }: { item: BodyRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => navigation.navigate("RecordDetail", { recordId: item.id })}
    >
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>{item.date}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textSecondary}
        />
      </View>
      <View style={styles.recordData}>
        <View style={styles.dataItem}>
          <Text style={styles.dataLabel}>{t("bodyStats.weight")}</Text>
          <Text style={styles.dataValue}>{item.weight} kg</Text>
        </View>
        <View style={styles.dataItem}>
          <Text style={styles.dataLabel}>{t("bodyStats.height")}</Text>
          <Text style={styles.dataValue}>{item.height} cm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="body-outline" size={64} color={theme.textTertiary} />
      <Text style={styles.emptyText}>{t("bodyStats.noRecords")}</Text>
      <Text style={styles.emptySubtext}>{t("bodyStats.addRecordsHint")}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          records.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>{t("bodyStats.addRecord")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate("LongTermStats")}
        >
          <Text style={styles.statsButtonText}>
            {t("bodyStats.viewLongTermStats")}
          </Text>
        </TouchableOpacity>
      </View>

      <AddRecordModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          loadRecords();
        }}
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
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    listContentEmpty: {
      flex: 1,
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
    separator: {
      height: 12,
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
    },
    addButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    statsButton: {
      backgroundColor: theme.success,
      paddingVertical: 16,
      borderRadius: 8,
    },
    statsButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonContainer: {
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 24,
      gap: 12,
    },
    footerLoader: {
      paddingVertical: 16,
      alignItems: "center",
    },
  });
