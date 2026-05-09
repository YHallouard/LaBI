import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { StackNavigationProp } from "@react-navigation/stack";
import { UploadStackParamList } from "../../../types/navigation";
import { CreateAnalysisUseCase } from "../../../domain/usecases/CreateAnalysisUseCase";
import { CreateManualAnalysisUseCase } from "../../../domain/usecases/CreateManualAnalysisUseCase";
import { GetReferenceRangeUseCase } from "../../../domain/usecases/GetReferenceRangeUseCase";
import { createEmptyBiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";
import { ScreenLayout } from "../../components/ScreenLayout";
import { ChoiceCard } from "../../components/ChoiceCard";
import { AnalysisEditModal } from "../../components/AnalysisEditModal";
import { colorPalette } from "../../../config/themes";

type UploadScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, "UploadScreen">;
  createAnalysisUseCase: CreateAnalysisUseCase;
  createManualAnalysisUseCase: CreateManualAnalysisUseCase | null;
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
};

export const UploadScreen: React.FC<UploadScreenProps> = ({
  navigation,
  createAnalysisUseCase,
  createManualAnalysisUseCase: _createManualAnalysisUseCase,
  getReferenceRangeUseCase,
}) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [emptyAnalysis] = useState(() => createEmptyBiologicalAnalysis(uuidv4));

  return (
    <ScreenLayout scrollable={false}>
      <View style={styles.container}>
        <Text style={styles.heading}>Comment veux-tu importer ?</Text>
        <Text style={styles.subheading}>
          Choisis la méthode qui te convient.
        </Text>

        <ChoiceCard
          title="Import par IA"
          subtitle="Importez un PDF, l'IA Mistral extrait automatiquement toutes les valeurs."
          iconName="sparkles"
          iconColor={colorPalette.primary.main}
          badge="Recommandé"
          hint="~30 sec"
          onPress={() => navigation.navigate("AIImportScreen")}
        />

        <ChoiceCard
          title="Import manuel"
          subtitle="Saisissez les valeurs vous-même, catégorie par catégorie."
          iconName="create-outline"
          iconColor={colorPalette.secondary.main}
          hint="Plein contrôle"
          onPress={() => setShowManualModal(true)}
        />

        <Text style={styles.footer}>
          Tu peux changer de méthode à tout moment.
        </Text>
      </View>

      <AnalysisEditModal
        visible={showManualModal}
        analysis={emptyAnalysis}
        title="Saisir manuellement"
        getReferenceRangeUseCase={getReferenceRangeUseCase}
        onSave={async (analysis) => { await createAnalysisUseCase.execute(analysis); }}
        onSaved={() => {
          setShowManualModal(false);
          navigation.navigate("UploadScreen");
        }}
        onClose={() => setShowManualModal(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colorPalette.neutral.main,
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subheading: {
    fontSize: 15,
    color: colorPalette.neutral.light,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  footer: {
    fontSize: 12,
    color: colorPalette.neutral.light,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
});
