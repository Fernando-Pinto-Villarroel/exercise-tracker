import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "../components/DatePicker";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";
import { useUserStore } from "../store/userStore";

export default function AddRecordScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { userInfo } = useUserStore();
  const { addRecord } = useBodyRecordsStore();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [neckPerimeter, setNeckPerimeter] = useState("");
  const [waistPerimeter, setWaistPerimeter] = useState("");
  const [hipPerimeter, setHipPerimeter] = useState("");

  const handleSave = async () => {
    if (!date || !weight || !height) {
      Alert.alert(t("common.error"), t("bodyStats.fillRequired"));
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      Alert.alert(t("common.error"), t("bodyStats.invalidWeight"));
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
      Alert.alert(t("common.error"), t("bodyStats.invalidHeight"));
      return;
    }

    const neckNum = neckPerimeter ? parseFloat(neckPerimeter) : undefined;
    const waistNum = waistPerimeter ? parseFloat(waistPerimeter) : undefined;
    const hipNum = hipPerimeter ? parseFloat(hipPerimeter) : undefined;

    if (
      neckNum !== undefined &&
      (isNaN(neckNum) || neckNum <= 0 || neckNum > 100)
    ) {
      Alert.alert(t("common.error"), t("bodyStats.invalidPerimeter"));
      return;
    }

    if (
      waistNum !== undefined &&
      (isNaN(waistNum) || waistNum <= 0 || waistNum > 200)
    ) {
      Alert.alert(t("common.error"), t("bodyStats.invalidPerimeter"));
      return;
    }

    if (
      hipNum !== undefined &&
      (isNaN(hipNum) || hipNum <= 0 || hipNum > 200)
    ) {
      Alert.alert(t("common.error"), t("bodyStats.invalidPerimeter"));
      return;
    }

    try {
      await addRecord({
        user_id: userInfo!.id!,
        date,
        weight: weightNum,
        height: heightNum,
        neck_perimeter: neckNum,
        waist_perimeter: waistNum,
        hip_perimeter: hipNum,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(t("common.error"), t("bodyStats.errorSaving"));
    }
  };

  const isFemale = userInfo?.gender === "female";
  const isValid = date && weight && height;

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.inputGroup}>
          <DatePicker
            label={t("bodyStats.date")}
            value={date}
            onChange={setDate}
            minYear={2000}
            maxYear={new Date().getFullYear()}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("bodyStats.weight")} (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="70"
            placeholderTextColor={theme.textTertiary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("bodyStats.height")} (cm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="170"
            placeholderTextColor={theme.textTertiary}
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.sectionTitle}>{t("bodyStats.optionalData")}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("bodyStats.neckPerimeter")} (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="35"
            placeholderTextColor={theme.textTertiary}
            value={neckPerimeter}
            onChangeText={setNeckPerimeter}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("bodyStats.waistPerimeter")} (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="80"
            placeholderTextColor={theme.textTertiary}
            value={waistPerimeter}
            onChangeText={setWaistPerimeter}
            keyboardType="decimal-pad"
          />
        </View>

        {isFemale && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("bodyStats.hipPerimeter")} (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="95"
              placeholderTextColor={theme.textTertiary}
              value={hipPerimeter}
              onChangeText={setHipPerimeter}
              keyboardType="decimal-pad"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveButtonText}>{t("common.save")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.card,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 24,
      marginBottom: 16,
    },
    saveButton: {
      marginTop: 32,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    saveButtonDisabled: {
      backgroundColor: theme.buttonDisabled,
    },
    saveButtonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
