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
import i18n from "../i18n";
import { initializeDailyReminders } from "../services/dailyReminderService";
import { useUserStore } from "../store/userStore";

export default function IntroScreen() {
  const { t } = useTranslation();
  const { saveUserInfo } = useUserStore();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [language, setLanguage] = useState<string>(i18n.language || "en");

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !birthday || !gender) {
      return;
    }

    await saveUserInfo({
      full_name: fullName.trim(),
      birthday,
      gender,
      language,
      theme: "light",
    });

    await initializeDailyReminders();
  };

  const isValid = fullName.trim() && birthday && gender;

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.langButton,
                language === "en" && styles.langButtonActive,
              ]}
              onPress={() => handleLanguageSelect("en")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === "en" && styles.langButtonTextActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langButton,
                language === "es" && styles.langButtonActive,
              ]}
              onPress={() => handleLanguageSelect("es")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === "es" && styles.langButtonTextActive,
                ]}
              >
                ES
              </Text>
            </TouchableOpacity>
          </View>

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
                minYear={1930}
                maxYear={new Date().getFullYear() - 13}
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
      paddingTop: 60,
      paddingBottom: 40,
    },
    languageRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 24,
      gap: 8,
    },
    langButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    langButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    langButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
      letterSpacing: 0.5,
    },
    langButtonTextActive: {
      color: "#ffffff",
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
