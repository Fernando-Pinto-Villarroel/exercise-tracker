import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserStore } from "../store/userStore";

export default function IntroScreen() {
  const { t } = useTranslation();
  const { saveUserInfo } = useUserStore();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const handleSubmit = async () => {
    if (!fullName.trim() || !age || !height || !weight) {
      return;
    }

    await saveUserInfo({
      full_name: fullName.trim(),
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      language: "en",
      theme: "light",
    });
  };

  const isValid = fullName.trim() && age && height && weight;

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("intro.title")}</Text>
          <Text style={styles.subtitle}>{t("intro.subtitle")}</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("intro.fullName")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("intro.fullNamePlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("intro.age")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("intro.agePlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("intro.height")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("intro.heightPlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("intro.weight")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("intro.weightPlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>{t("intro.continue")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 80,
      paddingBottom: 40,
    },
    title: {
      fontSize: 30,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 40,
    },
    formContainer: {
      gap: 12,
    },
    inputGroup: {
      marginBottom: 12,
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
    button: {
      marginTop: 40,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    buttonDisabled: {
      backgroundColor: theme.buttonDisabled,
    },
    buttonText: {
      textAlign: "center",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
