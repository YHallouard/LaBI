import { Stack } from "expo-router";
import { colorPalette, theme } from "../../src/config/themes";

export default function UploadLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: " ",
        headerStyle: { backgroundColor: colorPalette.neutral.white },
        headerTintColor: theme.buttons.info.backgroundColor,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Import", presentation: "modal" }} />
      <Stack.Screen name="ai-import" options={{ title: "Import par IA" }} />
    </Stack>
  );
}
