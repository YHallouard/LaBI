import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUseCases } from "../../src/presentation/contexts/UseCasesContext";
import AnalysisDetailsScreen from "../../src/presentation/screens/home/AnalysisDetailsScreen";
import { colorPalette } from "../../src/config/themes";

export default function AnalysisDetailsTab() {
  const { bundle } = useUseCases();

  if (
    !bundle?.getAnalysisById ||
    !bundle.updateAnalysis ||
    !bundle.deleteAnalysis ||
    !bundle.getReferenceRangeUseCase
  ) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <AnalysisDetailsScreen
      getAnalysisByIdUseCase={bundle.getAnalysisById}
      updateAnalysisUseCase={bundle.updateAnalysis}
      deleteAnalysisUseCase={bundle.deleteAnalysis}
      getReferenceRangeUseCase={bundle.getReferenceRangeUseCase}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
