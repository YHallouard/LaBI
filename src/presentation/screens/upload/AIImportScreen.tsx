import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { UploadStackParamList } from "../../../types/navigation";
import { AnalyzePdfUseCase } from "../../../domain/usecases/AnalyzePdfUseCase";
import { ScreenLayout } from "../../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { LAB_VALUE_CATEGORIES } from "../../../config/LabConfig";
import { colorPalette } from "../../../config/themes";
import {
  useAnalysisProgress,
  AnalysisStepStatus,
} from "../../hooks/useAnalysisProgress";

const PROCESSING_STEPS = [
  "Uploading document to Mistral",
  "Extracting analysis date",
  ...Object.keys(LAB_VALUE_CATEGORIES).map(
    (category) => `Analyzing ${category}`
  ),
  "Saving analysis",
  "Delete document from Mistral",
];

type AIImportScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, "AIImportScreen">;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  isLoadingApiKey: boolean;
  apiKeyError: string | null;
  checkAndLoadApiKey: () => Promise<void>;
};

export const AIImportScreen: React.FC<AIImportScreenProps> = ({
  navigation,
  analyzePdfUseCase,
  isLoadingApiKey,
  apiKeyError,
  checkAndLoadApiKey,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const hasCheckedApiKey = useRef<boolean>(false);
  const lastRunSucceededRef = useRef<boolean>(false);
  const prevIsAnalyzingRef = useRef<boolean>(false);

  const eventBus = analyzePdfUseCase?.getEventBus?.();
  const { stepStates, reset } = useAnalysisProgress(eventBus, PROCESSING_STEPS);

  useEffect(() => {
    const analysisRunEnded =
      prevIsAnalyzingRef.current === true && isAnalyzing === false;
    if (analysisRunEnded && lastRunSucceededRef.current) {
      setSuccessMessage("Analysis extracted and saved successfully");
      setTimeout(() => setSuccessMessage(null), 5000);
      lastRunSucceededRef.current = false;
    }
    prevIsAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    if (!isLoadingApiKey && !hasCheckedApiKey.current && !analyzePdfUseCase) {
      hasCheckedApiKey.current = true;
      checkAndLoadApiKey();
    }

    if (
      !isLoadingApiKey &&
      (analyzePdfUseCase !== null || apiKeyError !== null)
    ) {
      setIsInitialLoading(false);
    }
  }, [isLoadingApiKey, analyzePdfUseCase, apiKeyError]);

  const hasValidApiKey = (): boolean => {
    return !apiKeyError && Boolean(analyzePdfUseCase);
  };

  const pickAndProcessDocument = async (): Promise<void> => {
    if (isAnalyzing) return;

    if (!hasValidApiKey()) {
      setErrorMessage(
        apiKeyError || "API Key is not configured. Please set it in Settings."
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const pdfUri = await selectPdfDocument();
      if (!pdfUri) {
        setIsAnalyzing(false);
        return;
      }

      if (analyzePdfUseCase) {
        await analyzePdfDocument(pdfUri, analyzePdfUseCase);
      }
    } catch (err) {
      handleDocumentProcessingError(err);
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
    reset();
    lastRunSucceededRef.current = false;
    try {
      await useCase.execute(pdfUri);
      lastRunSucceededRef.current = true;
    } finally {
      useCase.removeProcessingListeners();
    }
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const handleDocumentProcessingError = (err: any): void => {
    Alert.alert("Error", "Failed to process PDF. Please check the logs.");
  };

  const navigateToSettings = (): void => {
    (navigation as any).navigate("Home", { screen: "ApiKeySettingsScreen" });
  };

  if (isLoadingApiKey || isInitialLoading) {
    return <LoadingView />;
  }

  return (
    <ScreenLayout scrollable={false}>
      <View style={styles.contentWrapper}>
        <Text style={styles.description}>
          Select a PDF of your lab report to automatically extract and save the
          data.
        </Text>

        {successMessage && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {!hasValidApiKey() && !errorMessage && (
          <ApiKeyMissingMessage
            apiKeyError={apiKeyError}
            onNavigateToSettings={navigateToSettings}
          />
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!hasValidApiKey() || isAnalyzing) && styles.disabledButton,
          ]}
          onPress={pickAndProcessDocument}
          disabled={!hasValidApiKey() || isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
              style={styles.buttonSpinner}
            />
          ) : (
            <Text style={styles.uploadButtonText}>Select & Analyze PDF</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          {isAnalyzing
            ? "Please wait while we process your document."
            : "Tap the button above to select and process your PDF report."}
        </Text>

        {isAnalyzing && <ProcessingStepsIndicator stepStates={stepStates} />}
      </View>
    </ScreenLayout>
  );
};

type ApiKeyMissingMessageProps = {
  apiKeyError: string | null;
  onNavigateToSettings: () => void;
};

const ApiKeyMissingMessage: React.FC<ApiKeyMissingMessageProps> = ({
  apiKeyError,
  onNavigateToSettings,
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>
      {apiKeyError || "API Key is not configured. Please set it in Settings."}
    </Text>
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={onNavigateToSettings}
    >
      <Ionicons
        name="settings-outline"
        size={16}
        color={colorPalette.neutral.white}
        style={styles.settingsIcon}
      />
      <Text style={styles.settingsButtonText}>Go to Settings</Text>
    </TouchableOpacity>
  </View>
);

const LoadingView = () => (
  <ScreenLayout scrollable={false}>
    <View style={styles.containerCentered}>
      <ActivityIndicator size="large" color="#2c7be5" />
      <Text style={styles.loadingText}>Loading configuration...</Text>
    </View>
  </ScreenLayout>
);

const ProcessingStepsIndicator = ({
  stepStates,
}: {
  stepStates: Map<string, AnalysisStepStatus>;
}) => (
  <View style={styles.processingStepsContainer}>
    {PROCESSING_STEPS.map((step) => {
      const status = stepStates.get(step) ?? "pending";
      const isCompleted = status === "completed";
      const isInProgress = status === "in_progress";
      const isFailed = status === "failed";

      return (
        <View key={step} style={styles.processingStepRow}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color="#00d97e" />
          ) : isFailed ? (
            <Ionicons name="alert-circle" size={24} color="#e63757" />
          ) : isInProgress ? (
            <ActivityIndicator size="small" color="#2c7be5" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#95aac9" />
          )}
          <Text
            style={[
              styles.processingStepText,
              isCompleted && styles.completedStepText,
              isInProgress && styles.activeStepText,
              isFailed && styles.failedStepText,
            ]}
          >
            {step}
          </Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  containerCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  description: {
    fontSize: 16,
    color: "#5a7184",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  uploadButton: {
    backgroundColor: "#2c7be5",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: "#a0c7f0",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonSpinner: {
    marginRight: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#5a7184",
  },
  errorContainer: {
    backgroundColor: "rgba(230, 55, 87, 0.1)",
    borderColor: "#e63757",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  errorText: {
    color: "#e63757",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  infoText: {
    marginTop: 30,
    fontSize: 14,
    color: "#5a7184",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  successContainer: {
    backgroundColor: "rgba(0, 217, 126, 0.1)",
    borderColor: "#00d97e",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  successText: {
    color: "#00a86b",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  settingsButton: {
    backgroundColor: "#2c7be5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  settingsButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  settingsIcon: {
    marginRight: 8,
  },
  processingStepsContainer: {
    marginTop: 20,
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
  processingStepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  processingStepText: {
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
  failedStepText: {
    color: "#e63757",
    fontWeight: "600",
  },
});
