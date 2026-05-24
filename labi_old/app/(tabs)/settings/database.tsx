import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUseCases } from "../../../src/presentation/contexts/UseCasesContext";
import { DatabaseSettingsScreen } from "../../../src/presentation/screens/settings/DatabaseSettingsScreen";
import { colorPalette } from "../../../src/config/themes";

export default function DatabaseSettingsTab() {
  const { bundle, onManualReload } = useUseCases();

  if (!bundle?.resetDatabase) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <DatabaseSettingsScreen
      resetDatabaseUseCase={bundle.resetDatabase}
      onManualReload={onManualReload}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
