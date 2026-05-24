import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUseCases } from "../../src/presentation/contexts/UseCasesContext";
import { ChartScreen } from "../../src/presentation/screens/charts/ChartScreen";
import { colorPalette } from "../../src/config/themes";

export default function ChartsTab() {
  const { bundle } = useUseCases();

  if (
    !bundle?.getAnalyses ||
    !bundle.getLabTestData ||
    !bundle.calculateStatistics ||
    !bundle.getReferenceRangeUseCase
  ) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <ChartScreen
      getAnalysesUseCase={bundle.getAnalyses}
      getLabTestDataUseCase={bundle.getLabTestData}
      calculateStatisticsUseCase={bundle.calculateStatistics}
      getReferenceRangeUseCase={bundle.getReferenceRangeUseCase}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
