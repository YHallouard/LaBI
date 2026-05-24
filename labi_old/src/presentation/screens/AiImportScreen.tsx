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
import {
  LAB_VALUE_CATEGORIES,
  LAB_VALUE_KEYS,
} from "../../config/LabConfig";
import { AgentEvent } from "../../application/agents/AgentEventBus";

type AiImportScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, "AiImportScreen">;
  route: RouteProp<UploadStackParamList, "AiImportScreen">;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  onAnalysisComplete?: () => void;
};

interface RetryStatus {
  attempt: number;
  maxAttempts: number;
  error: string;
}

export const AiImportScreen: React.FC<AiImportScreenProps> = ({
  navigation,
  analyzePdfUseCase,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [extractedCount, setExtractedCount] = useState<number>(0);
  const [retryStatus, setRetryStatus] = useState<RetryStatus | null>(null);
  const [missingCategories, setMissingCategories] = useState<string[]>([]);
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
      setRetryStatus(null);
    };

    setCompletedSteps([]);
    setExtractedCount(0);
    setRetryStatus(null);
    setMissingCategories([]);

    const bus = useCase.getEventBus();
    const unsubscribe = bus
      ? bus.on((event) => handleAgentEvent(event))
      : undefined;

    try {
      useCase.onProcessingStepStarted(onProcessingStepStarted);
      useCase.onProcessingStepCompleted(onProcessingStepCompleted);

      await useCase.execute(pdfUri);

      onAnalysisComplete?.();
      navigation.goBack();
    } finally {
      useCase.removeProcessingListeners();
      unsubscribe?.();
    }
  };

  const handleAgentEvent = (event: AgentEvent): void => {
    if (event.type === "value.extracted") {
      setExtractedCount((c) => c + 1);
    } else if (event.type === "step.retry") {
      setRetryStatus({
        attempt: event.attempt,
        maxAttempts: event.maxAttempts,
        error: event.error,
      });
    } else if (event.type === "analysis.partial") {
      setMissingCategories(event.missingCategories);
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

        <ExtractedCounter
          count={extractedCount}
          total={LAB_VALUE_KEYS.length}
        />

        {retryStatus && <RetryBanner status={retryStatus} />}

        {missingCategories.length > 0 && (
          <PartialAnalysisBanner missingCategories={missingCategories} />
        )}

        <ProcessingStepsIndicator
          processingStep={processingStep}
          completedSteps={completedSteps}
        />
      </View>
    </ScreenLayout>
  );
};

const ExtractedCounter = ({
  count,
  total,
}: {
  count: number;
  total: number;
}) => {
  if (count === 0) return null;
  return (
    <View style={styles.counterBox}>
      <Ionicons name="flask" size={20} color="#2c7be5" />
      <Text style={styles.counterText}>
        {count} / {total} biomarqueurs extraits
      </Text>
    </View>
  );
};

const RetryBanner = ({ status }: { status: RetryStatus }) => (
  <View style={styles.retryBanner}>
    <Ionicons name="refresh" size={16} color="#fb8500" />
    <Text style={styles.retryText}>
      Tentative {status.attempt + 1}/{status.maxAttempts} — {status.error}
    </Text>
  </View>
);

const PartialAnalysisBanner = ({
  missingCategories,
}: {
  missingCategories: string[];
}) => (
  <View style={styles.partialBanner}>
    <Ionicons name="alert-circle" size={18} color="#fbbf24" />
    <Text style={styles.partialText}>
      Catégorie{missingCategories.length > 1 ? "s" : ""} non extraite
      {missingCategories.length > 1 ? "s" : ""}: {missingCategories.join(", ")}.
      Vous pourrez compléter manuellement.
    </Text>
  </View>
);

const ProcessingStepsIndicator = ({
  processingStep,
  completedSteps,
}: {
  processingStep: string | null;
  completedSteps: string[];
}) => {
  const allSteps = [
    "Uploading document",
    "Extracting analysis date",
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
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e63757",
    textAlign: "center",
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f1ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  counterText: {
    marginLeft: 8,
    color: "#1f3d7a",
    fontWeight: "600",
    fontSize: 15,
  },
  retryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff5e6",
    borderColor: "#fb8500",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
  },
  retryText: {
    marginLeft: 8,
    color: "#7a4400",
    fontSize: 13,
    flex: 1,
  },
  partialBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef9c3",
    borderColor: "#fbbf24",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
  },
  partialText: {
    marginLeft: 8,
    color: "#92400e",
    fontSize: 13,
    flex: 1,
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
