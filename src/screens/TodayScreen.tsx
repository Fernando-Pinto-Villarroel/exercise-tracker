import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseList from "../components/ExerciseList";
import Timer from "../components/Timer";
import { useExerciseStore } from "../store/exerciseStore";

export default function TodayScreen() {
  const {
    todaySnapshot,
    todayCompletion,
    loadTodayData,
    createTodaySnapshot,
    toggleTodayCompletion,
  } = useExerciseStore();

  useFocusEffect(
    React.useCallback(() => {
      initializeToday();
    }, [])
  );

  const initializeToday = async () => {
    await createTodaySnapshot();
    await loadTodayData();
  };

  const handleToggleCompletion = async () => {
    await toggleTodayCompletion();
  };

  const isCompleted = todayCompletion?.is_completed || false;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {todaySnapshot.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No exercises planned for today</Text>
            <Text style={styles.emptySubtext}>
              Add exercises in &quot;My Exercises&quot; tab
            </Text>
          </View>
        ) : (
          <ExerciseList exercises={todaySnapshot} />
        )}

        <TouchableOpacity
          style={[
            styles.completeButton,
            isCompleted && styles.completeButtonDone,
          ]}
          onPress={handleToggleCompletion}
        >
          <Text style={styles.completeButtonText}>
            {isCompleted ? "Mark as Undone" : "Mark as Done"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Timer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 128,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 8,
  },
  completeButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  completeButtonDone: {
    backgroundColor: "#16a34a",
  },
  completeButtonText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
