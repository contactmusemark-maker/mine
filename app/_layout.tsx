import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pin" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen
        name="memory/[id]"
        options={{ headerShown: true, headerTitle: "", headerTransparent: true, headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: true, headerTitle: "Settings", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="journal"
        options={{ headerShown: true, headerTitle: "Journal", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="add-milestone"
        options={{ headerShown: true, headerTitle: "Add Milestone", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="set-anniversary"
        options={{ headerShown: true, headerTitle: "Anniversary Date", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="edit-journal/[id]"
        options={{ headerShown: true, headerTitle: "Edit Journal Entry", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="whatsapp-import"
        options={{ headerShown: true, headerTitle: "Import Her Chat", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="whatsapp-chat"
        options={{ headerShown: false, presentation: "card", gestureEnabled: true }}
      />
      <Stack.Screen
        name="letters"
        options={{ headerShown: true, headerTitle: "Letters to Her", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="write-letter"
        options={{ headerShown: true, headerTitle: "Write a Letter", headerBackTitle: "Back", presentation: "card" }}
      />
      <Stack.Screen
        name="view-letter/[id]"
        options={{ headerShown: false, presentation: "card", gestureEnabled: true }}
      />
      <Stack.Screen
        name="secret-gallery"
        options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <DatabaseProvider>
                <AuthProvider>
                  <RootLayoutNav />
                </AuthProvider>
              </DatabaseProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
