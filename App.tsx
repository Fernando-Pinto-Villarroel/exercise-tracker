import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { initDatabase } from "./src/database/init";
import "./src/i18n";
import MainTabs from "./src/navigation/MainTabs";
import IntroScreen from "./src/screens/IntroScreen";
import { initializeDailyReminders } from "./src/services/dailyReminderService";
import { useUserStore } from "./src/store/userStore";

// Must be called at module level so notifications show even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const { isOnboarded, loadUserData } = useUserStore();
  const { theme, loadThemePreference } = useTheme();

  useEffect(() => {
    async function initialize() {
      await initDatabase();
      await loadUserData();
      await loadThemePreference();

      // Initialize daily reminders only if user is onboarded
      if (isOnboarded) {
        await initializeDailyReminders();
      }

      setIsReady(true);
    }
    initialize();
  }, []);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.primary,
        },
        fonts: {
          regular: {
            fontFamily: "System",
            fontWeight: "400",
          },
          medium: {
            fontFamily: "System",
            fontWeight: "500",
          },
          bold: {
            fontFamily: "System",
            fontWeight: "700",
          },
          heavy: {
            fontFamily: "System",
            fontWeight: "900",
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: "none",
        }}
      >
        {!isOnboarded ? (
          <Stack.Screen name="Intro" component={IntroScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="auto" />
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
