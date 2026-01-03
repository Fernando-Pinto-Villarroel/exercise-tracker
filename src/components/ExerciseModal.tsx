import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useExerciseStore } from "../store/exerciseStore";
import { WeeklyPlanExercise } from "../types";

interface ExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  dayOfWeek: number;
  exercise: WeeklyPlanExercise | null;
}

const ICON_OPTIONS = [
  // Strength Training
  { family: "Ionicons", name: "barbell", label: "Barbell" },
  { family: "MaterialIcons", name: "fitness-center", label: "Dumbbell" },

  // Calisthenics
  { family: "MaterialIcons", name: "sports-gymnastics", label: "Kettlebell" },
  { family: "Ionicons", name: "body", label: "Body" },
  { family: "FontAwesome5", name: "child", label: "Plank" },

  // Cardio
  { family: "Ionicons", name: "walk", label: "Walk" },
  { family: "FontAwesome5", name: "running", label: "Running" },
  { family: "MaterialIcons", name: "directions-bike", label: "Cycling" },
  { family: "FontAwesome5", name: "swimmer", label: "Swimming" },

  // Sports
  { family: "FontAwesome5", name: "basketball-ball", label: "Basketball" },
  { family: "FontAwesome5", name: "futbol", label: "Soccer" },
  { family: "FontAwesome5", name: "volleyball-ball", label: "Volleyball" },
  { family: "FontAwesome5", name: "table-tennis", label: "Ping Pong" },
  { family: "FontAwesome5", name: "baseball-ball", label: "Baseball" },
  { family: "FontAwesome5", name: "football-ball", label: "Football" },

  // Yoga & Flexibility
  { family: "MaterialIcons", name: "self-improvement", label: "Yoga" },

  // Outdoor Activities
  { family: "FontAwesome5", name: "hiking", label: "Hiking" },
  { family: "FontAwesome5", name: "skiing", label: "Skiing" },
];

export default function ExerciseModal({
  visible,
  onClose,
  dayOfWeek,
  exercise,
}: ExerciseModalProps) {
  const { saveExerciseToDay, updateExercise } = useExerciseStore();
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    if (exercise) {
      setName(exercise.exercise_name);
      setSets(exercise.sets.toString());
      setReps(exercise.reps.toString());
      const icon = ICON_OPTIONS.find(
        (opt) =>
          opt.family === exercise.icon_family && opt.name === exercise.icon_name
      );
      if (icon) setSelectedIcon(icon);
    } else {
      setName("");
      setSets("");
      setReps("");
      setSelectedIcon(ICON_OPTIONS[0]);
    }
  }, [exercise, visible]);

  const handleSave = async () => {
    if (!name.trim() || !sets || !reps) return;

    const exerciseData = {
      exercise_name: name.trim(),
      icon_name: selectedIcon.name,
      icon_family: selectedIcon.family,
      sets: parseInt(sets),
      reps: parseInt(reps),
      sort_order: 0,
    };

    if (exercise?.id) {
      await updateExercise(exercise.id, exerciseData);
    } else {
      await saveExerciseToDay(dayOfWeek, exerciseData);
    }

    onClose();
  };

  const isValid = name.trim() && sets && reps;

  const getIconComponent = (option: (typeof ICON_OPTIONS)[0]) => {
    const iconFamilies = { Ionicons, MaterialIcons, FontAwesome5 };
    const IconFamily = iconFamilies[option.family as keyof typeof iconFamilies];
    return <IconFamily name={option.name as any} size={32} color="#3b82f6" />;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {exercise ? "Edit Exercise" : "Add Exercise"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exercise Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Push-ups"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Sets</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.iconSection}>
              <Text style={styles.label}>Select Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={`${option.family}-${option.name}`}
                    style={[
                      styles.iconButton,
                      selectedIcon.name === option.name &&
                        selectedIcon.family === option.family &&
                        styles.iconButtonSelected,
                    ]}
                    onPress={() => setSelectedIcon(option)}
                  >
                    {getIconComponent(option)}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !isValid && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isValid}
              >
                <Text style={styles.saveButtonText}>
                  {exercise ? "Update Exercise" : "Add Exercise"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 16,
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
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
  },
  iconSection: {
    marginBottom: 24,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  iconButtonSelected: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  saveButtonContainer: {
    marginBottom: 32,
    marginTop: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  saveButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  saveButtonText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
