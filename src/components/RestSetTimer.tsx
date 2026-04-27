import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface RestSetTimerProps {
  restTimeSeconds: number;
}

export default function RestSetTimer({ restTimeSeconds }: RestSetTimerProps) {
  const { theme } = useTheme();
  const [currentSeconds, setCurrentSeconds] = useState(restTimeSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const isDone = currentSeconds === 0;

  useEffect(() => {
    setCurrentSeconds(restTimeSeconds);
    setIsRunning(false);
  }, [restTimeSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCurrentSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
    } else if (!isDone) {
      setIsRunning(true);
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setCurrentSeconds(restTimeSeconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleToggle}
        disabled={isDone}
      >
        <Ionicons
          name={isRunning ? "pause" : "play"}
          size={20}
          color={isDone ? theme.textTertiary : theme.primary}
        />
      </TouchableOpacity>

      <Text style={[styles.timeText, isDone && styles.timeTextDone]}>
        {formatTime(currentSeconds)}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRestart}>
        <Ionicons name="refresh" size={20} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
    },
    button: {
      padding: 6,
    },
    timeText: {
      flex: 1,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
    },
    timeTextDone: {
      color: theme.textTertiary,
    },
  });
