import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function CustomHeader({
  title,
  showBackButton = true,
}: CustomHeaderProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={styles.headerContainer}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {showBackButton && <View style={styles.backButton} />}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.headerBackground,
      height: 50,
      paddingHorizontal: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      color: theme.headerText,
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      flex: 1,
    },
  });
