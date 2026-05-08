import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { UploadStackParamList } from "../../types/navigation";
import { AnalyzePdfUseCase } from "../../application/usecases/AnalyzePdfUseCase";
import { ProcessingStepCallback } from "../../ports/services/ProgressProcessor";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { LAB_VALUE_CATEGORIES } from "../../config/LabConfig";

type AiImportScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, "AiImportScreen">;
  route: RouteProp<UploadStackParamList, "AiImportScreen">;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  onAnalysisComplete?: () => void;
};

export const AiImportScreen: React.FC<AiImportScreenProps> = ({
  navigation,
  analyzePdfUseCase,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [hasPicked, setHasPicked] = useState(false);

  useEffect(() => {
    if (!hasPicked) {
      setHasPicked(true);
      pickAndProcessDocument();
    }
  }, []);

  const pickAndProcessDocument = async (): Promise<void> => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const pdfUri = await selectPdfDocument();
      if (!pdfUri) {
        navigation.goBack();
        return;
      }

      if (analyzePdfUseCase) {
        await analyzePdfDocument(pdfUri, analyzePdfUseCase);
      }
    } catch {
      handleDocumentProcessingError();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectPdfDocument = async (): Promise<string | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0].uri;
  };

  const analyzePdfDocument = async (
    pdfUri: string,
    useCase: AnalyzePdfUseCase
  ): Promise<void> => {
    const onProcessingStepStarted: ProcessingStepCallback = (step: string) => {
      setProcessingStep(step);
    };

    const onProcessingStepCompleted: ProcessingStepCallback = (step: string) => {
      setCompletedSteps((prev) => [...prev, step]);
      setProcessingStep(null);
    };

    setCompletedSteps([]);

    try {
      useCase.onProcessingStepStarted(onProcessingStepStarted);
      useCase.onProcessingStepCompleted(onProcessingStepCompleted);

      await useCase.execute(pdfUri);

      onAnalysisComplete?.();
      navigation.goBack();
    } finally {
      useCase.removeProcessingListeners();
    }
  };

  const handleDocumentProcessingError = (): void => {
    Alert.alert("Erreur", "Impossible de traiter le PDF. Veuillez réessayer.");
    setIsAnalyzing(false);
  };

  if (!isAnalyzing && errorMessage) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scrollable={false}>
      <View style={styles.centered}>
        <Text style={styles.waitText}>
          Veuillez patienter pendant le traitement de votre document.
        </Text>
        <ProcessingStepsIndicator
          processingStep={processingStep}
          completedSteps={completedSteps}
        />
      </View>
    </ScreenLayout>
  );
};

const ProcessingStepsIndicator = ({
  processingStep,
  completedSteps,
}: {
  processingStep: string | null;
  completedSteps: string[];
}) => {
  const allSteps = [
    "Uploading document",
    "Extracting date",
    ...Object.keys(LAB_VALUE_CATEGORIES).map(
      (category) => `Analyzing ${category}`
    ),
    "Saving analysis",
  ];

  return (
    <View style={styles.stepsContainer}>
      {allSteps.map((step) => {
        const isCompleted = completedSteps.includes(step);
        const isInProgress = processingStep === step;

        return (
          <View key={step} style={styles.stepRow}>
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color="#00d97e" />
            ) : isInProgress ? (
              <ActivityIndicator size="small" color="#2c7be5" />
            ) : (
              <Ionicons name="ellipse-outline" size={24} color="#95aac9" />
            )}
            <Text
              style={[
                styles.stepText,
                isCompleted && styles.completedStepText,
                isInProgress && styles.activeStepText,
              ]}
            >
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  waitText: {
    fontSize: 16,
    color: "#5a7184",
    textAlign: "center",
    marginBottom: 30,
  },
  errorText: {
    fontSize: 16,
    color: "#e63757",
    textAlign: "center",
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  stepText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#95aac9",
  },
  completedStepText: {
    color: "#00d97e",
    fontWeight: "500",
  },
  activeStepText: {
    color: "#2c7be5",
    fontWeight: "bold",
  },
});
