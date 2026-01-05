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
import DatePicker from "../components/DatePicker";
import { useTheme } from "../contexts/ThemeContext";
import { useUserStore } from "../store/userStore";

export default function IntroScreen() {
  const { t } = useTranslation();
  const { saveUserInfo } = useUserStore();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);

  const handleSubmit = async () => {
    if (!fullName.trim() || !birthday || !gender) {
      return;
    }

    await saveUserInfo({
      full_name: fullName.trim(),
      birthday,
      gender,
      language: "en",
      theme: "light",
    });
  };

  const isValid = fullName.trim() && birthday && gender;

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
              <DatePicker
                label={t("intro.birthday")}
                value={birthday}
                onChange={setBirthday}
                placeholder={t("intro.birthdayPlaceholder")}
                minYear={1920}
                maxYear={new Date().getFullYear()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("intro.gender")}</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === "male" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender("male")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "male" && styles.genderButtonTextActive,
                    ]}
                  >
                    {t("intro.male")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === "female" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender("female")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "female" && styles.genderButtonTextActive,
                    ]}
                  >
                    {t("intro.female")}
                  </Text>
                </TouchableOpacity>
              </View>
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
    genderButtons: {
      flexDirection: "row",
      gap: 12,
    },
    genderButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
    },
    genderButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    genderButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    genderButtonTextActive: {
      color: theme.primary,
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
