import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

import { initializeApp } from "../../infrastructure/AppInitializer";
import { RepositoryFactory } from "../../infrastructure/repositories/RepositoryFactory";
import { ProfileService } from "../../domain/services/ProfileService";
import { getDatabaseStorage } from "../../infrastructure/database/DatabaseInitializer";
import { MistralOcrService } from "../../adapters/services/MistralOcrService";

import {
  GetAnalysesUseCase,
  GetAnalysisByIdUseCase,
  GetLabTestDataUseCase,
} from "../../domain/usecases/GetAnalysesUseCase";
import { AnalyzePdfUseCase } from "../../domain/usecases/AnalyzePdfUseCase";
import { UpdateAnalysisUseCase } from "../../domain/usecases/UpdateAnalysisUseCase";
import { DeleteAnalysisUseCase } from "../../domain/usecases/DeleteAnalysisUseCase";
import { SaveApiKeyUseCase } from "../../domain/usecases/SaveApiKeyUseCase";
import { LoadApiKeyUseCase } from "../../domain/usecases/LoadApiKeyUseCase";
import { DeleteApiKeyUseCase } from "../../domain/usecases/DeleteApiKeyUseCase";
import { CalculateStatisticsUseCase } from "../../domain/usecases/CalculateStatisticsUseCase";
import { ResetDatabaseUseCase } from "../../domain/usecases/ResetDatabaseUseCase";
import { ReferenceRangeCalculator } from "../../domain/services/ReferenceRangeCalculator";
import { GetReferenceRangeUseCase } from "../../domain/usecases/GetReferenceRangeUseCase";
import { GetPinnedMetricsUseCase } from "../../domain/usecases/GetPinnedMetricsUseCase";
import { SavePinnedMetricsUseCase } from "../../domain/usecases/SavePinnedMetricsUseCase";
import { CalculateHealthMagnitudeUseCase } from "../../domain/usecases/CalculateHealthMagnitudeUseCase";
import { RetrieveUserProfileUseCase } from "../../domain/usecases/RetrieveUserProfileUseCase";
import { GetUserAgeUseCase } from "../../domain/usecases/GetUserAgeUseCase";
import { CreateAnalysisUseCase } from "../../domain/usecases/CreateAnalysisUseCase";

export type UseCasesBundle = {
  getAnalyses: GetAnalysesUseCase;
  getAnalysisById: GetAnalysisByIdUseCase;
  updateAnalysis: UpdateAnalysisUseCase;
  deleteAnalysis: DeleteAnalysisUseCase;
  createAnalysis: CreateAnalysisUseCase;
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
  analyzePdfUseCase: AnalyzePdfUseCase | null;
};

type UseCasesContextType = {
  bundle: UseCasesBundle | null;
  apiKeyError: string | null;
  appError: string | null;
  isReady: boolean;
  setAnalyzePdfUseCase: (uc: AnalyzePdfUseCase | null) => void;
  setApiKeyError: (msg: string | null) => void;
  onApiKeySaved: (apiKey: string) => Promise<void>;
  onApiKeyDeleted: () => void;
  onManualReload: () => void;
  checkAndLoadApiKey: () => Promise<void>;
};

const UseCasesContext = createContext<UseCasesContextType | undefined>(undefined);

export const useUseCases = (): UseCasesContextType => {
  const ctx = useContext(UseCasesContext);
  if (!ctx) throw new Error("useUseCases must be used within UseCasesProvider");
  return ctx;
};

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 500, fade: true });

export const UseCasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bundle, setBundle] = useState<UseCasesBundle | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    startInitialization();
  }, []);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  const buildBundle = async (): Promise<UseCasesBundle> => {
    const databaseStorage = await getDatabaseStorage();
    const biologicalRepo = await RepositoryFactory.getBiologicalAnalysisRepository();
    const userProfileRepo = await RepositoryFactory.getUserProfileRepository();

    const profileService = ProfileService.getInstance();
    profileService.initialize(userProfileRepo);

    const getReferenceRangeUseCase = new GetReferenceRangeUseCase(
      new ReferenceRangeCalculator(),
      userProfileRepo
    );
    const getAnalyses = new GetAnalysesUseCase(biologicalRepo);

    return {
      getAnalyses,
      getAnalysisById: new GetAnalysisByIdUseCase(biologicalRepo),
      updateAnalysis: new UpdateAnalysisUseCase(biologicalRepo),
      deleteAnalysis: new DeleteAnalysisUseCase(biologicalRepo),
      createAnalysis: new CreateAnalysisUseCase(biologicalRepo),
      getLabTestData: new GetLabTestDataUseCase(),
      saveApiKey: new SaveApiKeyUseCase(),
      loadApiKey: new LoadApiKeyUseCase(),
      deleteApiKey: new DeleteApiKeyUseCase(),
      calculateStatistics: new CalculateStatisticsUseCase(),
      resetDatabase: new ResetDatabaseUseCase(databaseStorage, profileService),
      getReferenceRangeUseCase,
      getPinnedMetricsUseCase: new GetPinnedMetricsUseCase(userProfileRepo),
      savePinnedMetricsUseCase: new SavePinnedMetricsUseCase(userProfileRepo),
      calculateHealthMagnitudeUseCase: new CalculateHealthMagnitudeUseCase(
        getAnalyses,
        getReferenceRangeUseCase
      ),
      retrieveUserProfileUseCase: new RetrieveUserProfileUseCase(userProfileRepo),
      getUserAgeUseCase: new GetUserAgeUseCase(),
      analyzePdfUseCase: null,
    };
  };

  const checkAndLoadApiKey = async (loadApiKey?: LoadApiKeyUseCase): Promise<void> => {
    const uc = loadApiKey ?? bundle?.loadApiKey;
    if (!uc) return;
    try {
      const key = await uc.execute();
      if (key) {
        setApiKeyError(null);
        await createOcrService(key);
      } else {
        setApiKeyError("API key not set. Please configure it in Settings.");
      }
    } catch {
      setApiKeyError("Failed to load API key configuration.");
    }
  };

  const createOcrService = async (apiKey: string): Promise<void> => {
    const biologicalRepo = await RepositoryFactory.getBiologicalAnalysisRepository();
    const ocrService = new MistralOcrService(apiKey);
    setBundle((prev) =>
      prev ? { ...prev, analyzePdfUseCase: new AnalyzePdfUseCase(ocrService, biologicalRepo) } : prev
    );
  };

  const startInitialization = async (): Promise<void> => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    try {
      await initializeApp();
      const built = await buildBundle();
      setBundle(built);
      await checkAndLoadApiKey(built.loadApiKey);
      setIsReady(true);
    } catch (error) {
      console.error("Error during initialization", error);
      setAppError("Failed to initialize application. Please restart the app.");
      setIsReady(true);
    } finally {
      isInitializing.current = false;
    }
  };

  const setAnalyzePdfUseCase = (uc: AnalyzePdfUseCase | null) => {
    setBundle((prev) => (prev ? { ...prev, analyzePdfUseCase: uc } : prev));
  };

  const onApiKeySaved = async (apiKey: string): Promise<void> => {
    setApiKeyError(null);
    await createOcrService(apiKey);
  };

  const onApiKeyDeleted = (): void => {
    setApiKeyError("API key not set. Please configure it in Settings.");
    setAnalyzePdfUseCase(null);
  };

  const onManualReload = (): void => {
    setBundle(null);
    setApiKeyError(null);
    setAppError(null);
    isInitializing.current = false;
    startInitialization();
  };

  return (
    <UseCasesContext.Provider
      value={{
        bundle,
        apiKeyError,
        appError,
        isReady,
        setAnalyzePdfUseCase,
        setApiKeyError,
        onApiKeySaved,
        onApiKeyDeleted,
        onManualReload,
        checkAndLoadApiKey: () => checkAndLoadApiKey(),
      }}
    >
      {children}
    </UseCasesContext.Provider>
  );
};
