import '../src/infrastructure/polyfills';
import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UseCasesProvider } from '../src/presentation/contexts/UseCasesContext';
import { TimeRangeProvider } from '../src/presentation/contexts/TimeRangeContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UseCasesProvider>
          <TimeRangeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="analyses" />
              <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              <Stack.Screen
                name="marker-info"
                options={{
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.5],
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 24,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </TimeRangeProvider>
        </UseCasesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
