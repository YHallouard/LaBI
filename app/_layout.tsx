import "../src/infrastructure/polyfills";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { UseCasesProvider } from "../src/presentation/contexts/UseCasesContext";
import { TimeRangeProvider } from "../src/presentation/contexts/TimeRangeContext";
import { ProfileRequiredModal } from "../src/presentation/components/ProfileRequiredModal";
import { ProfileService } from "../src/domain/services/ProfileService";
import { colorPalette } from "../src/config/themes";
import { useUseCases } from "../src/presentation/contexts/UseCasesContext";

function AppReady({ children }: { children: React.ReactNode }) {
  const { appError, isReady } = useUseCases();

  if (!isReady) return null;

  if (appError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{appError}</Text>
      </View>
    );
  }

  return (
    <ProfileRequiredModal profileService={ProfileService.getInstance()}>
      <TimeRangeProvider>{children}</TimeRangeProvider>
    </ProfileRequiredModal>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UseCasesProvider>
        <AppReady>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="analyses/index"
              options={{ title: "All Analyses", headerBackTitle: " " }}
            />
            <Stack.Screen
              name="analyses/[id]"
              options={{ title: "Analysis Details", headerBackTitle: " " }}
            />
            <Stack.Screen
              name="upload/index"
              options={{ presentation: "modal", headerShown: false }}
            />
            <Stack.Screen
              name="upload/ai-import"
              options={{ title: "Import par IA", headerBackTitle: " " }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AppReady>
      </UseCasesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
  },
  error: {
    fontSize: 16,
    color: colorPalette.primary.main,
    textAlign: "center",
    padding: 20,
  },
});
