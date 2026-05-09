import "./src/infrastructure/polyfills";

import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
// LoadingOverlay removed; Home shows skeleton during data load
import { initializeApp } from "./src/infrastructure/AppInitializer";
import { RepositoryFactory } from "./src/infrastructure/repositories/RepositoryFactory";
import { ProfileService } from "./src/domain/services/ProfileService";
import { colorPalette } from "./src/config/themes";
import { AppNavigator } from "./src/presentation/navigation/AppNavigator";
import {
  GetAnalysesUseCase,
  GetAnalysisByIdUseCase,
  GetLabTestDataUseCase,
} from "./src/domain/usecases/GetAnalysesUseCase";
import { AnalyzePdfUseCase } from "./src/application/usecases/AnalyzePdfUseCase";
import { CreateManualAnalysisUseCase } from "./src/application/usecases/CreateManualAnalysisUseCase";
import { AiImportScreen } from "./src/presentation/screens/AiImportScreen";
import { SQLiteBiologicalAnalysisRepository } from "./src/adapters/repositories/SQLiteBiologicalAnalysisRepository";
import { MistralOcrService } from "./src/adapters/services/MistralOcrService";
import { UpdateAnalysisUseCase } from "./src/domain/usecases/UpdateAnalysisUseCase";
import { DeleteAnalysisUseCase } from "./src/domain/usecases/DeleteAnalysisUseCase";
import { SaveApiKeyUseCase } from "./src/domain/usecases/SaveApiKeyUseCase";
import { LoadApiKeyUseCase } from "./src/domain/usecases/LoadApiKeyUseCase";
import { DeleteApiKeyUseCase } from "./src/domain/usecases/DeleteApiKeyUseCase";
import { CalculateStatisticsUseCase } from "./src/domain/usecases/CalculateStatisticsUseCase";
import { ResetDatabaseUseCase } from "./src/domain/usecases/ResetDatabaseUseCase";
import { ReferenceRangeCalculator } from "./src/domain/services/ReferenceRangeCalculator";
import { GetReferenceRangeUseCase } from "./src/domain/usecases/GetReferenceRangeUseCase";
import { GetPinnedMetricsUseCase } from "./src/domain/usecases/GetPinnedMetricsUseCase";
import { SavePinnedMetricsUseCase } from "./src/domain/usecases/SavePinnedMetricsUseCase";
import { CalculateHealthMagnitudeUseCase } from "./src/domain/usecases/CalculateHealthMagnitudeUseCase";
import { RetrieveUserProfileUseCase } from "./src/domain/usecases/RetrieveUserProfileUseCase";
import { GetUserAgeUseCase } from "./src/domain/usecases/GetUserAgeUseCase";
import { CreateAnalysisUseCase } from "./src/domain/usecases/CreateAnalysisUseCase";
import { getDatabaseStorage } from "./src/infrastructure/database/DatabaseInitializer";

// overlay timings removed

type UseCasesBundle = {
  getAnalyses: GetAnalysesUseCase;
  getAnalysisById: GetAnalysisByIdUseCase;
  updateAnalysis: UpdateAnalysisUseCase;
  deleteAnalysis: DeleteAnalysisUseCase;
  getLabTestData: GetLabTestDataUseCase;
  saveApiKey: SaveApiKeyUseCase;
  loadApiKey: LoadApiKeyUseCase;
  deleteApiKey: DeleteApiKeyUseCase;
  calculateStatistics: CalculateStatisticsUseCase;
  resetDatabase: ResetDatabaseUseCase;
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
  getPinnedMetricsUseCase: GetPinnedMetricsUseCase;
  savePinnedMetricsUseCase: SavePinnedMetricsUseCase;
  calculateHealthMagnitudeUseCase: CalculateHealthMagnitudeUseCase;
  retrieveUserProfileUseCase: RetrieveUserProfileUseCase;
  getUserAgeUseCase: GetUserAgeUseCase;
  createAnalysis: CreateAnalysisUseCase;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options for smooth transition
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function App() {
  const [bundle, setBundle] = useState<UseCasesBundle | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [forceReload, setForceReload] = useState(0);
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  const isInitializing = useRef(false);

  useEffect(() => {
    startInitialization();
  }, []);

  const startInitialization = async (): Promise<void> => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    try {
      await initializeApp();

      const useCases = await buildUseCases();
      setBundle(useCases);

      await checkAndLoadApiKey(useCases.loadApiKey);

      // Add a small delay for smooth transition
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsAppInitialized(true);
    } catch (error) {
      console.error("Error during initialization", error);
      setAppError("Failed to initialize application. Please restart the app.");
      setIsAppInitialized(true);
    } finally {
      isInitializing.current = false;
    }
  };

  const buildUseCases = async (): Promise<UseCasesBundle> => {
    const databaseStorage = await getDatabaseStorage();

    const biologicalAnalysisRepository =
      await RepositoryFactory.getBiologicalAnalysisRepository();
    const userProfileRepository =
      await RepositoryFactory.getUserProfileRepository();

    const getAnalyses = new GetAnalysesUseCase(biologicalAnalysisRepository);
    const getAnalysisById = new GetAnalysisByIdUseCase(
      biologicalAnalysisRepository
    );
    const updateAnalysis = new UpdateAnalysisUseCase(
      biologicalAnalysisRepository
    );
    const deleteAnalysis = new DeleteAnalysisUseCase(
      biologicalAnalysisRepository
    );
    const createAnalysis = new CreateAnalysisUseCase(
      biologicalAnalysisRepository
    );
    const getLabTestData = new GetLabTestDataUseCase();
    const saveApiKey = new SaveApiKeyUseCase();
    const loadApiKey = new LoadApiKeyUseCase();
    const deleteApiKey = new DeleteApiKeyUseCase();
    const calculateStatistics = new CalculateStatisticsUseCase();

    const profileService = ProfileService.getInstance();
    profileService.initialize(userProfileRepository);

    const resetDatabase = new ResetDatabaseUseCase(
      databaseStorage,
      profileService
    );
    const referenceRangeCalculator = new ReferenceRangeCalculator();
    const getReferenceRangeUseCase = new GetReferenceRangeUseCase(
      referenceRangeCalculator,
      userProfileRepository
    );
    const getPinnedMetricsUseCase = new GetPinnedMetricsUseCase(
      userProfileRepository
    );
    const savePinnedMetricsUseCase = new SavePinnedMetricsUseCase(
      userProfileRepository
    );
    const calculateHealthMagnitudeUseCase = new CalculateHealthMagnitudeUseCase(
      getAnalyses,
      getReferenceRangeUseCase
    );
    const retrieveUserProfileUseCase = new RetrieveUserProfileUseCase(
      userProfileRepository
    );
    const getUserAgeUseCase = new GetUserAgeUseCase();

    const createManualAnalysis = new CreateManualAnalysisUseCase(repository);

    return {
      getAnalyses,
      getAnalysisById,
      updateAnalysis,
      deleteAnalysis,
      getLabTestData,
      saveApiKey,
      loadApiKey,
      deleteApiKey,
      calculateStatistics,
      resetDatabase,
      getReferenceRangeUseCase,
      getPinnedMetricsUseCase,
      savePinnedMetricsUseCase,
      calculateHealthMagnitudeUseCase,
      retrieveUserProfileUseCase,
      getUserAgeUseCase,
      createAnalysis,
      analyzePdfUseCase: null,
    };
  };

  const checkAndLoadApiKey = async (
    loadApiKey: LoadApiKeyUseCase
  ): Promise<void> => {
    try {
      const loadedApiKey = await loadApiKey.execute();
      if (loadedApiKey) {
        setApiKeyError(null);
        await createOcrService(loadedApiKey);
      } else {
        setApiKeyError("API key not set. Please configure it in Settings.");
      }
    } catch {
      setApiKeyError("Failed to load API key configuration.");
    }
  };

  const createOcrService = async (apiKey: string) => {
    const ocrService = new MistralOcrService(apiKey);
    const biologicalAnalysisRepository =
      await RepositoryFactory.getBiologicalAnalysisRepository();
    setBundle((prev) =>
      prev
        ? {
            ...prev,
            analyzePdfUseCase: new AnalyzePdfUseCase(
              ocrService,
              biologicalAnalysisRepository
            ),
          }
        : prev
    );
  };

  const handleApiKeyDeleted = () => {
    setApiKeyError("API key not set. Please configure it in Settings.");
    setBundle((prev) => (prev ? { ...prev, analyzePdfUseCase: null } : prev));
  };

  const handleApiKeySaved = async (apiKey: string) => {
    setApiKeyError(null);
    await createOcrService(apiKey);
  };

  const handleManualReload = (): void => {
    setBundle(null);
    setApiKeyError(null);
    setAppError(null);
    setForceReload((v) => v + 1);
    startInitialization();
  };

  const readyToRenderApp = !!bundle && !appError && isAppInitialized;

  // Hide splash screen when app is ready
  useEffect(() => {
    if (readyToRenderApp) {
      SplashScreen.hideAsync();
    }
  }, [readyToRenderApp]);

  if (appError) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colorPalette.neutral.background }}
      >
        <ErrorView errorMessage={appError} />
      </View>
    );
  }

  if (!readyToRenderApp) {
    return null; // Let splash screen handle the display
  }

  return (
    <View style={{ flex: 1, backgroundColor: colorPalette.neutral.background }}>
      {bundle && (
        <AppNavigator
          getAnalysesUseCase={bundle.getAnalyses}
          getAnalysisByIdUseCase={bundle.getAnalysisById}
          updateAnalysisUseCase={bundle.updateAnalysis}
          deleteAnalysisUseCase={bundle.deleteAnalysis}
          analyzePdfUseCase={bundle.analyzePdfUseCase}
          saveApiKeyUseCase={bundle.saveApiKey}
          loadApiKeyUseCase={bundle.loadApiKey}
          deleteApiKeyUseCase={bundle.deleteApiKey}
          getLabTestDataUseCase={bundle.getLabTestData}
          calculateStatisticsUseCase={bundle.calculateStatistics}
          resetDatabaseUseCase={bundle.resetDatabase}
          getReferenceRangeUseCase={bundle.getReferenceRangeUseCase}
          getPinnedMetricsUseCase={bundle.getPinnedMetricsUseCase}
          savePinnedMetricsUseCase={bundle.savePinnedMetricsUseCase}
          calculateHealthMagnitudeUseCase={
            bundle.calculateHealthMagnitudeUseCase
          }
          retrieveUserProfileUseCase={bundle.retrieveUserProfileUseCase}
          getUserAgeUseCase={bundle.getUserAgeUseCase}
          createAnalysisUseCase={bundle.createAnalysis}
          isLoading={false}
          apiKeyError={apiKeyError}
          appError={appError}
          forceReload={forceReload}
          onApiKeyDeleted={handleApiKeyDeleted}
          onApiKeySaved={handleApiKeySaved}
          onManualReload={handleManualReload}
          checkAndLoadApiKey={() => checkAndLoadApiKey(bundle.loadApiKey)}
        />
      )}
    </View>
  );
}

const ErrorView = ({ errorMessage }: { errorMessage: string }) => (
  <View style={styles.centeredLoader}>
    <Text style={styles.errorText}>{errorMessage}</Text>
  </View>
);

const styles = StyleSheet.create({
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colorPalette.primary.main,
    textAlign: "center",
    padding: 20,
  },
});
