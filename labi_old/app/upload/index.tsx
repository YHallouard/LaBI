import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUseCases } from "../../src/presentation/contexts/UseCasesContext";
import { UploadScreen } from "../../src/presentation/screens/upload/UploadScreen";
import { colorPalette } from "../../src/config/themes";

export default function UploadTab() {
  const { bundle } = useUseCases();

  if (!bundle?.createAnalysis || !bundle.getReferenceRangeUseCase) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <UploadScreen
      createAnalysisUseCase={bundle.createAnalysis}
      getReferenceRangeUseCase={bundle.getReferenceRangeUseCase}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
