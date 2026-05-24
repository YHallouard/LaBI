import { Stack } from "expo-router";
import { colorPalette, theme } from "../../../src/config/themes";

const screenOptions = {
  headerBackTitle: " ",
  headerStyle: { backgroundColor: colorPalette.neutral.white },
  headerTintColor: theme.buttons.info.backgroundColor,
};

export default function SettingsLayout() {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="profile" options={{ title: "User Profile" }} />
      <Stack.Screen name="sync" options={{ title: "Device Sync" }} />
      <Stack.Screen name="api-key" options={{ title: "API Key Settings" }} />
      <Stack.Screen name="api-key-tutorial" options={{ title: "API Key Tutorial" }} />
      <Stack.Screen name="database" options={{ title: "Database Settings" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy & Security" }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="help" options={{ title: "Help Center" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
    </Stack>
  );
}
