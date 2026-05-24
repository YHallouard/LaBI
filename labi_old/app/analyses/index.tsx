import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUseCases } from "../../src/presentation/contexts/UseCasesContext";
import { AllAnalysesScreen } from "../../src/presentation/screens/home/AllAnalysesScreen";
import { colorPalette } from "../../src/config/themes";

export default function AllAnalysesTab() {
  const { bundle } = useUseCases();

  if (!bundle?.getAnalyses || !bundle.deleteAnalysis) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <AllAnalysesScreen
      getAnalysesUseCase={bundle.getAnalyses}
      deleteAnalysisUseCase={bundle.deleteAnalysis}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
