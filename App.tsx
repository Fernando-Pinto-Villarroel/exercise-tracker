import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { initDatabase } from "./src/database/init";
import MainTabs from "./src/navigation/MainTabs";
import IntroScreen from "./src/screens/IntroScreen";
import { useUserStore } from "./src/store/userStore";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { isOnboarded, loadUserData } = useUserStore();

  useEffect(() => {
    async function initialize() {
      await initDatabase();
      // await addMissingColumns();
      await loadUserData();
      setIsReady(true);
    }
    initialize();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isOnboarded ? (
            <Stack.Screen name="Intro" component={IntroScreen} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
