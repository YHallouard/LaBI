import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUseCases } from "../../../src/presentation/contexts/UseCasesContext";
import { ApiKeySettingsScreen } from "../../../src/presentation/screens/settings/ApiKeySettingsScreen";
import { colorPalette } from "../../../src/config/themes";

export default function ApiKeySettingsTab() {
  const { bundle, onApiKeyDeleted, onApiKeySaved, onManualReload } = useUseCases();

  if (!bundle?.saveApiKey || !bundle.loadApiKey || !bundle.deleteApiKey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <ApiKeySettingsScreen
      saveApiKeyUseCase={bundle.saveApiKey}
      loadApiKeyUseCase={bundle.loadApiKey}
      deleteApiKeyUseCase={bundle.deleteApiKey}
      onApiKeyDeleted={onApiKeyDeleted}
      onApiKeySaved={onApiKeySaved}
      onManualReload={onManualReload}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
