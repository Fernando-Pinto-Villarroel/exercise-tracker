import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useBodyRecordsStore } from "../store/bodyRecordsStore";
import { useUserStore } from "../store/userStore";
import { BodyRecord } from "../types";
import DatePicker from "./DatePicker";

const sanitizeDecimal = (value: string) => {
  let v = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  return v;
};

interface EditRecordModalProps {
  visible: boolean;
  record: BodyRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export default function EditRecordModal({
  visible,
  record,
  onClose,
  onSaved,
}: EditRecordModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { userInfo } = useUserStore();
  const { updateRecord } = useBodyRecordsStore();

  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [neckPerimeter, setNeckPerimeter] = useState("");
  const [waistPerimeter, setWaistPerimeter] = useState("");
  const [hipPerimeter, setHipPerimeter] = useState("");
  const [bicepPerimeter, setBicepPerimeter] = useState("");
  const [thighPerimeter, setThighPerimeter] = useState("");
  const [calfPerimeter, setCalfPerimeter] = useState("");
  const [shoulderPerimeter, setShoulderPerimeter] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputYOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!visible || !record) return;
    setDate(record.date);
    setWeight(String(record.weight));
    setHeight(String(record.height));
    setNeckPerimeter(
      record.neck_perimeter ? String(record.neck_perimeter) : "",
    );
    setWaistPerimeter(
      record.waist_perimeter ? String(record.waist_perimeter) : "",
    );
    setHipPerimeter(record.hip_perimeter ? String(record.hip_perimeter) : "");
    setBicepPerimeter(
      record.bicep_perimeter ? String(record.bicep_perimeter) : "",
    );
    setThighPerimeter(
      record.thigh_perimeter ? String(record.thigh_perimeter) : "",
    );
    setCalfPerimeter(
      record.calf_perimeter ? String(record.calf_perimeter) : "",
    );
    setShoulderPerimeter(
      record.shoulder_perimeter ? String(record.shoulder_perimeter) : "",
    );
  }, [visible, record]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const scrollToField = (key: string) => {
    setTimeout(() => {
      const y = inputYOffsets.current[key];
      if (y != null && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, y - 80),
          animated: true,
        });
      }
    }, 350);
  };

  const handleSave = async () => {
    if (!record?.id) return;

    if (!date || !weight || !height) {
      Alert.alert(t("common.error"), t("bodyStats.fillRequired"));
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
      Alert.alert(t("common.error"), t("bodyStats.invalidWeight"));
      return;
    }

    if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
      Alert.alert(t("common.error"), t("bodyStats.invalidHeight"));
      return;
    }

    const validatePerimeter = (value: string) => {
      if (!value) return undefined;
      const num = parseFloat(value);
      if (isNaN(num) || num < 10 || num > 200) return null;
      return num;
    };

    const neckNum = validatePerimeter(neckPerimeter);
    const waistNum = validatePerimeter(waistPerimeter);
    const hipNum = validatePerimeter(hipPerimeter);
    const bicepNum = validatePerimeter(bicepPerimeter);
    const thighNum = validatePerimeter(thighPerimeter);
    const calfNum = validatePerimeter(calfPerimeter);
    const shoulderNum = validatePerimeter(shoulderPerimeter);

    if (
      neckNum === null ||
      waistNum === null ||
      hipNum === null ||
      bicepNum === null ||
      thighNum === null ||
      calfNum === null ||
      shoulderNum === null
    ) {
      Alert.alert(t("common.error"), t("bodyStats.invalidPerimeter"));
      return;
    }

    try {
      await updateRecord(record.id, {
        user_id: record.user_id,
        date,
        weight: weightNum,
        height: heightNum,
        neck_perimeter: neckNum,
        waist_perimeter: waistNum,
        hip_perimeter: hipNum,
        bicep_perimeter: bicepNum,
        thigh_perimeter: thighNum,
        calf_perimeter: calfNum,
        shoulder_perimeter: shoulderNum,
      });
      await onSaved();
      onClose();
    } catch {
      Alert.alert(t("common.error"), t("bodyStats.errorUpdating"));
    }
  };

  const isFemale = userInfo?.gender === "female";
  const isValid = date && weight && height;
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("bodyStats.editRecord")}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              styles.scrollContent,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight },
            ]}
          >
            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.date = e.nativeEvent.layout.y;
              }}
            >
              <DatePicker
                label={t("bodyStats.date")}
                value={date}
                onChange={setDate}
                minYear={2000}
                maxYear={new Date().getFullYear()}
              />
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.weight = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>{t("bodyStats.weight")} (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="70"
                placeholderTextColor={theme.textTertiary}
                value={weight}
                onChangeText={(v) => setWeight(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("weight")}
              />
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.height = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>{t("bodyStats.height")} (cm) *</Text>
              <TextInput
                style={styles.input}
                placeholder="170"
                placeholderTextColor={theme.textTertiary}
                value={height}
                onChangeText={(v) => setHeight(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("height")}
              />
            </View>

            <Text style={styles.sectionTitle}>
              {t("bodyStats.optionalDataBFP")}
            </Text>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.neck = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>
                {t("bodyStats.neckPerimeter")} (cm)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="35"
                placeholderTextColor={theme.textTertiary}
                value={neckPerimeter}
                onChangeText={(v) => setNeckPerimeter(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("neck")}
              />
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.waist = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>
                {t("bodyStats.waistPerimeter")} (cm)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor={theme.textTertiary}
                value={waistPerimeter}
                onChangeText={(v) => setWaistPerimeter(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("waist")}
              />
            </View>

            {isFemale && (
              <View
                style={styles.inputGroup}
                onLayout={(e) => {
                  inputYOffsets.current.hip = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.label}>
                  {t("bodyStats.hipPerimeter")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="95"
                  placeholderTextColor={theme.textTertiary}
                  value={hipPerimeter}
                  onChangeText={(v) => setHipPerimeter(sanitizeDecimal(v))}
                  keyboardType="decimal-pad"
                  onFocus={() => scrollToField("hip")}
                />
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {t("bodyStats.optionalDataMuscle")}
            </Text>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.bicep = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>
                {t("bodyStats.bicepPerimeter")} (cm)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={theme.textTertiary}
                value={bicepPerimeter}
                onChangeText={(v) => setBicepPerimeter(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("bicep")}
              />
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.thigh = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>
                {t("bodyStats.thighPerimeter")} (cm)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="55"
                placeholderTextColor={theme.textTertiary}
                value={thighPerimeter}
                onChangeText={(v) => setThighPerimeter(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("thigh")}
              />
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.calf = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>
                {t("bodyStats.calfPerimeter")} (cm)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="38"
                placeholderTextColor={theme.textTertiary}
                value={calfPerimeter}
                onChangeText={(v) => setCalfPerimeter(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("calf")}
              />
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                inputYOffsets.current.shoulder = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>
                {t("bodyStats.shoulderPerimeter")} (cm)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="110"
                placeholderTextColor={theme.textTertiary}
                value={shoulderPerimeter}
                onChangeText={(v) => setShoulderPerimeter(sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                onFocus={() => scrollToField("shoulder")}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    scrollContent: {
      paddingBottom: 32,
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
      backgroundColor: theme.background,
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
      marginBottom: 48,
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
