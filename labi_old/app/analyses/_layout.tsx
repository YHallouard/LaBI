import { Stack } from "expo-router";
import { colorPalette, theme } from "../../src/config/themes";

export default function AnalysesLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: " ",
        headerStyle: { backgroundColor: colorPalette.neutral.white },
        headerTintColor: theme.buttons.info.backgroundColor,
      }}
    >
      <Stack.Screen name="index" options={{ title: "All Analyses" }} />
      <Stack.Screen name="[id]" options={{ title: "Analysis Details" }} />
    </Stack>
  );
}
