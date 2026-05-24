import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useUseCases } from "../../src/presentation/contexts/UseCasesContext";
import { HomeScreen } from "../../src/presentation/screens/home/HomeScreen";
import { colorPalette } from "../../src/config/themes";

export default function HomeTab() {
  const { bundle } = useUseCases();

  if (
    !bundle?.getAnalyses ||
    !bundle.getLabTestData ||
    !bundle.calculateStatistics ||
    !bundle.getReferenceRangeUseCase ||
    !bundle.getPinnedMetricsUseCase ||
    !bundle.savePinnedMetricsUseCase ||
    !bundle.calculateHealthMagnitudeUseCase ||
    !bundle.retrieveUserProfileUseCase ||
    !bundle.getUserAgeUseCase
  ) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen
        getAnalysesUseCase={bundle.getAnalyses}
        getLabTestDataUseCase={bundle.getLabTestData}
        calculateStatisticsUseCase={bundle.calculateStatistics}
        getReferenceRangeUseCase={bundle.getReferenceRangeUseCase}
        getPinnedMetricsUseCase={bundle.getPinnedMetricsUseCase}
        savePinnedMetricsUseCase={bundle.savePinnedMetricsUseCase}
        calculateHealthMagnitudeUseCase={bundle.calculateHealthMagnitudeUseCase}
        retrieveUserProfileUseCase={bundle.retrieveUserProfileUseCase}
        getUserAgeUseCase={bundle.getUserAgeUseCase}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: colorPalette.neutral.light },
});
