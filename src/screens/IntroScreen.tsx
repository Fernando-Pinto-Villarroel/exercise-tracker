import React, { useState } from "react";
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
import { useUserStore } from "../store/userStore";

export default function IntroScreen() {
  const { saveUserInfo } = useUserStore();
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
    });
  };

  const isValid = fullName.trim() && age && height && weight;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Exercise Tracker</Text>
          <Text style={styles.subtitle}>
            Let&apos;s get started by setting up your profile
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your height"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your weight"
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
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
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
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
