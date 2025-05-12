import "./src/infrastructure/polyfills";

import React, { useState, useEffect, useRef } from "react";
import {
  NavigationContainer,
  Route,
  useNavigation,
} from "@react-navigation/native";
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
  BottomTabBarButtonProps,
} from "@react-navigation/bottom-tabs";
import {
  createStackNavigator,
  StackNavigationProp,
  StackScreenProps,
} from "@react-navigation/stack";
import { ChartScreen } from "./src/presentation/screens/ChartScreen";
import { HomeScreen } from "./src/presentation/screens/HomeScreen";
import { UploadScreen } from "./src/presentation/screens/UploadScreen";
import { SettingsScreen } from "./src/presentation/screens/SettingsScreen";
import { ApiKeySettingsScreen } from "./src/presentation/screens/ApiKeySettingsScreen";
import { DatabaseSettingsScreen } from "./src/presentation/screens/DatabaseSettingsScreen";
import { ProfileScreen } from "./src/presentation/screens/ProfileScreen";
import {
  GetAnalysesUseCase,
  GetAnalysisByIdUseCase,
  GetLabTestDataUseCase,
} from "./src/application/usecases/GetAnalysesUseCase";
import { AnalyzePdfUseCase } from "./src/application/usecases/AnalyzePdfUseCase";
import { SQLiteBiologicalAnalysisRepository } from "./src/adapters/repositories/SQLiteBiologicalAnalysisRepository";
import { MistralOcrService } from "./src/adapters/services/MistralOcrService";
import {
  initializeDatabase,
  getDatabaseStorage,
} from "./src/infrastructure/database/DatabaseInitializer";
import { Ionicons } from "@expo/vector-icons";
import { UpdateAnalysisUseCase } from "./src/application/usecases/UpdateAnalysisUseCase";
import { DeleteAnalysisUseCase } from "./src/application/usecases/DeleteAnalysisUseCase";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from "react-native";
import AnalysisDetailsScreen from "./src/presentation/screens/AnalysisDetailsScreen";
import { SaveApiKeyUseCase } from "./src/application/usecases/SaveApiKeyUseCase";
import { LoadApiKeyUseCase } from "./src/application/usecases/LoadApiKeyUseCase";
import { DeleteApiKeyUseCase } from "./src/application/usecases/DeleteApiKeyUseCase";
import { HemeaLogo } from "./src/presentation/components";
import { CalculateStatisticsUseCase } from "./src/application/usecases/CalculateStatisticsUseCase";
import {
  HomeStackParamList,
  ChartStackParamList,
  UploadStackParamList,
  RootTabParamList,
} from "./src/types/navigation";
import { HelpCenterScreen } from "./src/presentation/screens/HelpCenterScreen";
import { PrivacySecurityScreen } from "./src/presentation/screens/PrivacySecurityScreen";
import { AboutScreen } from "./src/presentation/screens/AboutScreen";
import { LoadingOverlay } from "./src/presentation/components/LoadingOverlay";
import { PrivacyPolicyWebViewScreen } from "./src/presentation/screens/PrivacyPolicyWebViewScreen";
import { MistralApiKeyTutorialScreen } from "./src/presentation/screens/MistralApiKeyTutorialScreen";
import { ResetDatabaseUseCase } from "./src/application/usecases/ResetDatabaseUseCase";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ReferenceRangeCalculator } from "./src/domain/services/ReferenceRangeCalculator";
import { ReferenceRangeService } from "./src/application/services/ReferenceRangeService";
import { SQLiteUserProfileRepository } from "./src/adapters/repositories/SQLiteUserProfileRepository";
import { ProfileRequiredModal } from "./src/presentation/components/ProfileRequiredModal";

const HomeStackNavigator = createStackNavigator<HomeStackParamList>();
const ChartStackNavigator = createStackNavigator<ChartStackParamList>();
const UploadStackNavigator = createStackNavigator<UploadStackParamList>();

const Tab = createBottomTabNavigator<RootTabParamList>();

const MIN_LOADING_TIME = 1500;
const FADE_DURATION = 800;
const CIRCLE_ANIMATION_DURATION = MIN_LOADING_TIME + FADE_DURATION - 100;
const SAFETY_TIMEOUT_DURATION = 8000;
const ANIMATION_START_DELAY = 300;

type NavigateToSettingsFunction = () => void;

const SettingsButton = () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const navigation = useNavigation<StackNavigationProp<any>>();

  const navigateToSettings: NavigateToSettingsFunction = () =>
    navigation.navigate("Home", { screen: "SettingsScreen" });

  return (
    <TouchableOpacity onPress={navigateToSettings} style={styles.headerButton}>
      <Ionicons name="settings-outline" size={24} color="#2c7be5" />
    </TouchableOpacity>
  );
};

export default function App() {
  const [analyzePdfUseCase, setAnalyzePdfUseCase] =
    useState<AnalyzePdfUseCase | null>(null);
  const [getAnalysesUseCase, setGetAnalysesUseCase] =
    useState<GetAnalysesUseCase | null>(null);
  const [getAnalysisByIdUseCase, setGetAnalysisByIdUseCase] =
    useState<GetAnalysisByIdUseCase | null>(null);
  const [updateAnalysisUseCase, setUpdateAnalysisUseCase] =
    useState<UpdateAnalysisUseCase | null>(null);
  const [deleteAnalysisUseCase, setDeleteAnalysisUseCase] =
    useState<DeleteAnalysisUseCase | null>(null);
  const [saveApiKeyUseCase, setSaveApiKeyUseCase] =
    useState<SaveApiKeyUseCase | null>(null);
  const [loadApiKeyUseCase, setLoadApiKeyUseCase] =
    useState<LoadApiKeyUseCase | null>(null);
  const [deleteApiKeyUseCase, setDeleteApiKeyUseCase] =
    useState<DeleteApiKeyUseCase | null>(null);
  const [getLabTestDataUseCase, setGetLabTestDataUseCase] =
    useState<GetLabTestDataUseCase | null>(null);
  const [calculateStatisticsUseCase, setCalculateStatisticsUseCase] =
    useState<CalculateStatisticsUseCase | null>(null);
  const [resetDatabaseUseCase, setResetDatabaseUseCase] =
    useState<ResetDatabaseUseCase | null>(null);
  const [referenceRangeService, setReferenceRangeService] =
    useState<ReferenceRangeService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [forceReload, setForceReload] = useState(0);
  const [appInitialized, setAppInitialized] = useState(false);
  const [skipInitialDataLoad, setSkipInitialDataLoad] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const circleProgress = useRef(new Animated.Value(0)).current;
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [circleAnimationComplete, setCircleAnimationComplete] = useState(false);

  const [loaderVisible, setLoaderVisible] = useState(true);

  useEffect(() => {
    resetAppState();
    startCircleAnimation();
    initializeApplication();
    configureSafetyTimeout();
  }, [forceReload]);

  useEffect(() => {
    if (shouldStartFadeOutAnimation()) {
      startFadeOutAnimation();
    }
  }, [isLoading, appInitialized, circleAnimationComplete]);

  const resetAppState = () => {
    setIsLoading(true);
    setAppInitialized(false);
    setIsTransitioning(true);
    setCircleAnimationComplete(false);
    fadeAnim.setValue(1);
    circleProgress.setValue(0);
  };

  const startCircleAnimation = () => {
    setTimeout(animateCircleProgress, ANIMATION_START_DELAY);
  };

  const animateCircleProgress = () => {
    Animated.timing(circleProgress, {
      toValue: 1,
      duration: CIRCLE_ANIMATION_DURATION,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: true,
    }).start(handleCircleAnimationComplete);
  };

  const handleCircleAnimationComplete = ({
    finished,
  }: {
    finished: boolean;
  }) => {
    if (finished) {
      setCircleAnimationComplete(true);
    }
  };

  const configureSafetyTimeout = () => {
    const safetyTimer = setTimeout(
      forceCompleteLoading,
      SAFETY_TIMEOUT_DURATION
    );
    return () => clearTimeout(safetyTimer);
  };

  const forceCompleteLoading = () => {
    setIsLoading(false);
    setAppInitialized(true);
    setCircleAnimationComplete(true);
  };

  const shouldStartFadeOutAnimation = () => {
    return (!isLoading && appInitialized) || circleAnimationComplete;
  };

  const startFadeOutAnimation = () => {
    setTimeout(animateFadeOut, 300);
  };

  const animateFadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(handleFadeOutComplete);
  };

  const handleFadeOutComplete = ({ finished }: { finished: boolean }) => {
    if (finished) {
      setIsTransitioning(false);
    }
  };

  const handleManualReload = (): void => {
    setLoaderVisible(true);
    setSkipInitialDataLoad(true);
    setForceReload((prev) => prev + 1);
  };

  const checkAndLoadApiKey = async (): Promise<void> => {
    if (!loadApiKeyUseCase) return;

    try {
      const loadedApiKey = await loadApiKeyUseCase.execute();

      if (loadedApiKey) {
        setApiKeyError(null);
        createOcrService(loadedApiKey);
      } else {
        handleMissingApiKey();
      }
    } catch (error) {
      handleApiKeyLoadError(error);
    }
  };

  const handleApiKeyDeleted = () => {
    setApiKeyError("API key not set. Please configure it in Settings.");
    setAnalyzePdfUseCase(null);
  };

  const handleApiKeySaved = async (apiKey: string) => {
    setApiKeyError(null);
    createOcrService(apiKey);
  };

  const initializeApplication = async () => {
    const startTime = Date.now();
    try {
      await initializeDatabase();
      const repository = createRepository();
      await initializeUseCases(repository);

      await checkAndLoadApiKey();
      setAppInitialized(true);

      if (!skipInitialDataLoad) {
        setTimeout(loadInitialData, 2000);
      } else {
        setSkipInitialDataLoad(false);
      }
    } catch (error) {
      handleInitializationError(error);
      setAppInitialized(true);
    } finally {
      scheduleLoadingCompletion(startTime);
    }
  };

  const loadInitialData = () => {
    preloadAnalysesData().catch(handlePreloadDataError);
  };

  const handlePreloadDataError = (err: Error) => {
    console.warn("Deferred data loading failed:", err);
  };

  const preloadAnalysesData = async () => {
    if (!getAnalysesUseCase) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadAnalysesWithRetry(getAnalysesUseCase);
    } catch (error) {
      console.error("Error in preloadAnalysesData:", error);
    }
  };

  const loadAnalysesWithRetry = async (analysesUseCase: GetAnalysesUseCase) => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await analysesUseCase.execute();
        break;
      } catch {
        retryCount++;

        if (retryCount >= maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const scheduleLoadingCompletion = (startTime: number) => {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

    if (remainingTime > 0) {
      setTimeout(completeLoading, remainingTime);
    } else {
      completeLoading();
    }
  };

  const completeLoading = () => {
    setIsLoading(false);
  };

  const initializeUseCases = async (
    repository: SQLiteBiologicalAnalysisRepository
  ) => {
    const useCases = createUseCases(repository);
    assignUseCasesToState(useCases);
    return useCases.loadApiKey;
  };

  const createUseCases = (repository: SQLiteBiologicalAnalysisRepository) => {
    const getAnalyses = new GetAnalysesUseCase(repository);
    const getAnalysisById = new GetAnalysisByIdUseCase(repository);
    const updateAnalysis = new UpdateAnalysisUseCase(repository);
    const deleteAnalysis = new DeleteAnalysisUseCase(repository);
    const getLabTestData = new GetLabTestDataUseCase();
    const saveApiKey = new SaveApiKeyUseCase();
    const loadApiKey = new LoadApiKeyUseCase();
    const deleteApiKey = new DeleteApiKeyUseCase();
    const calculateStatistics = new CalculateStatisticsUseCase();
    const resetDatabase = new ResetDatabaseUseCase(getDatabaseStorage());

    const userProfileRepository = new SQLiteUserProfileRepository();
    const referenceRangeCalculator = new ReferenceRangeCalculator();
    const referenceRange = new ReferenceRangeService(
      referenceRangeCalculator,
      userProfileRepository
    );

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
      referenceRange,
    };
  };

  const assignUseCasesToState = (
    useCases: ReturnType<typeof createUseCases>
  ) => {
    setGetAnalysesUseCase(useCases.getAnalyses);
    setGetAnalysisByIdUseCase(useCases.getAnalysisById);
    setUpdateAnalysisUseCase(useCases.updateAnalysis);
    setDeleteAnalysisUseCase(useCases.deleteAnalysis);
    setGetLabTestDataUseCase(useCases.getLabTestData);
    setSaveApiKeyUseCase(useCases.saveApiKey);
    setLoadApiKeyUseCase(useCases.loadApiKey);
    setDeleteApiKeyUseCase(useCases.deleteApiKey);
    setCalculateStatisticsUseCase(useCases.calculateStatistics);
    setResetDatabaseUseCase(useCases.resetDatabase);
    setReferenceRangeService(useCases.referenceRange);
  };

  const createRepository = () => {
    return new SQLiteBiologicalAnalysisRepository();
  };

  const createOcrService = (apiKey: string) => {
    const ocrService = new MistralOcrService(apiKey);
    const repository = new SQLiteBiologicalAnalysisRepository();
    setAnalyzePdfUseCase(new AnalyzePdfUseCase(ocrService, repository));
  };

  const handleMissingApiKey = () => {
    setApiKeyError("API key not set. Please configure it in Settings.");
    setAnalyzePdfUseCase(null);
  };

  const handleApiKeyLoadError = () => {
    setApiKeyError("Failed to load API key configuration.");
    setAnalyzePdfUseCase(null);
  };

  const handleInitializationError = () => {
    setAppError("Failed to initialize application. Please restart the app.");
  };

  const HomeStack = React.useMemo(() => {
    const HomeStackComponent = () => (
      <HomeStackNavigator.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: " ",
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerTitleAlign: "center",
        }}
      >
        <HomeStackNavigator.Screen
          name="HomeScreen"
          options={{
            headerTitle: () => <HemeaLogo />,
            headerRight: () => <SettingsButton />,
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, "HomeScreen">) => {
            if (!getAnalysesUseCase || !deleteAnalysisUseCase) {
              return (
                <ErrorView errorMessage="Application is not properly initialized" />
              );
            }
            return (
              <HomeScreen
                {...props}
                getAnalysesUseCase={getAnalysesUseCase}
                deleteAnalysisUseCase={deleteAnalysisUseCase}
              />
            );
          }}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="AnalysisDetails"
          options={{
            headerTitle: "Analysis Details",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, "AnalysisDetails">) => {
            if (
              !getAnalysisByIdUseCase ||
              !updateAnalysisUseCase ||
              !referenceRangeService
            ) {
              return (
                <ErrorView errorMessage="Application is not properly initialized" />
              );
            }
            return (
              <AnalysisDetailsScreen
                {...props}
                getAnalysisByIdUseCase={getAnalysisByIdUseCase}
                updateAnalysisUseCase={updateAnalysisUseCase}
                referenceRangeService={referenceRangeService}
              />
            );
          }}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="SettingsScreen"
          options={{
            headerTitle: "Settings",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, "SettingsScreen">) => {
            if (
              !saveApiKeyUseCase ||
              !loadApiKeyUseCase ||
              !deleteApiKeyUseCase ||
              !resetDatabaseUseCase
            ) {
              return (
                <ErrorView errorMessage="Application is not properly initialized" />
              );
            }
            return (
              <SettingsScreen
                {...props}
                saveApiKeyUseCase={saveApiKeyUseCase}
                loadApiKeyUseCase={loadApiKeyUseCase}
                deleteApiKeyUseCase={deleteApiKeyUseCase}
                resetDatabaseUseCase={resetDatabaseUseCase}
                onApiKeyDeleted={handleApiKeyDeleted}
                onApiKeySaved={handleApiKeySaved}
                onManualReload={handleManualReload}
              />
            );
          }}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="HelpCenterScreen"
          options={{
            headerTitle: "Help Center",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
          component={HelpCenterScreen}
        />
        <HomeStackNavigator.Screen
          name="PrivacySecurityScreen"
          options={{
            headerTitle: "Privacy & Security",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
          component={PrivacySecurityScreen}
        />
        <HomeStackNavigator.Screen
          name="AboutScreen"
          options={{
            headerTitle: "About",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
          component={AboutScreen}
        />
        <HomeStackNavigator.Screen
          name="PrivacyPolicyWebView"
          options={{
            headerTitle: "Privacy Policy",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
          component={PrivacyPolicyWebViewScreen}
        />
        <HomeStackNavigator.Screen
          name="MistralApiKeyTutorial"
          options={{
            headerTitle: "API Key Tutorial",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
          component={MistralApiKeyTutorialScreen}
        />
        <HomeStackNavigator.Screen
          name="ApiKeySettingsScreen"
          options={{
            headerTitle: "API Key Settings",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
        >
          {(
            props: StackScreenProps<HomeStackParamList, "ApiKeySettingsScreen">
          ) => {
            if (
              !saveApiKeyUseCase ||
              !loadApiKeyUseCase ||
              !deleteApiKeyUseCase
            ) {
              return (
                <ErrorView errorMessage="Application is not properly initialized" />
              );
            }
            return (
              <ApiKeySettingsScreen
                {...props}
                saveApiKeyUseCase={saveApiKeyUseCase}
                loadApiKeyUseCase={loadApiKeyUseCase}
                deleteApiKeyUseCase={deleteApiKeyUseCase}
                onApiKeyDeleted={handleApiKeyDeleted}
                onApiKeySaved={handleApiKeySaved}
                onManualReload={handleManualReload}
              />
            );
          }}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="DatabaseSettingsScreen"
          options={{
            headerTitle: "Database Settings",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
        >
          {(
            props: StackScreenProps<
              HomeStackParamList,
              "DatabaseSettingsScreen"
            >
          ) => {
            if (!resetDatabaseUseCase) {
              return (
                <ErrorView errorMessage="Application is not properly initialized" />
              );
            }
            return (
              <DatabaseSettingsScreen
                {...props}
                resetDatabaseUseCase={resetDatabaseUseCase}
                onManualReload={handleManualReload}
              />
            );
          }}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="ProfileScreen"
          options={{
            headerTitle: "User Profile",
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
          component={ProfileScreen}
        />
      </HomeStackNavigator.Navigator>
    );
    HomeStackComponent.displayName = "HomeStackComponent";
    return HomeStackComponent;
  }, [
    getAnalysesUseCase,
    deleteAnalysisUseCase,
    getAnalysisByIdUseCase,
    updateAnalysisUseCase,
    saveApiKeyUseCase,
    loadApiKeyUseCase,
    deleteApiKeyUseCase,
    resetDatabaseUseCase,
    referenceRangeService,
  ]);

  const ChartStack = React.useMemo(() => {
    const ChartStackComponent = () => (
      <ChartStackNavigator.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: " ",
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerTitleAlign: "center",
        }}
      >
        <ChartStackNavigator.Screen
          name="ChartScreen"
          options={{
            headerTitle: () => <HemeaLogo />,
            headerRight: () => <SettingsButton />,
          }}
        >
          {(props: StackScreenProps<ChartStackParamList, "ChartScreen">) => {
            if (
              !getAnalysesUseCase ||
              !getLabTestDataUseCase ||
              !calculateStatisticsUseCase ||
              !referenceRangeService
            ) {
              return (
                <ErrorView errorMessage="Application is not properly initialized" />
              );
            }
            return (
              <ChartScreen
                {...props}
                getAnalysesUseCase={getAnalysesUseCase}
                getLabTestDataUseCase={getLabTestDataUseCase}
                calculateStatisticsUseCase={calculateStatisticsUseCase}
                referenceRangeService={referenceRangeService}
              />
            );
          }}
        </ChartStackNavigator.Screen>
      </ChartStackNavigator.Navigator>
    );
    ChartStackComponent.displayName = "ChartStackComponent";
    return ChartStackComponent;
  }, [
    getAnalysesUseCase,
    getLabTestDataUseCase,
    calculateStatisticsUseCase,
    referenceRangeService,
  ]);

  const UploadStack = React.useMemo(() => {
    const UploadStackComponent = () => (
      <UploadStackNavigator.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: " ",
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerTitleAlign: "center",
        }}
      >
        <UploadStackNavigator.Screen
          name="UploadScreen"
          options={{
            headerTitle: () => <HemeaLogo />,
            headerRight: () => <SettingsButton />,
          }}
        >
          {(props: StackScreenProps<UploadStackParamList, "UploadScreen">) => (
            <UploadScreen
              {...props}
              analyzePdfUseCase={analyzePdfUseCase}
              isLoadingApiKey={isLoading}
              apiKeyError={apiKeyError}
              checkAndLoadApiKey={checkAndLoadApiKey}
            />
          )}
        </UploadStackNavigator.Screen>
      </UploadStackNavigator.Navigator>
    );
    UploadStackComponent.displayName = "UploadStackComponent";
    return UploadStackComponent;
  }, [analyzePdfUseCase, isLoading, apiKeyError]);

  const handleLoaderFinish = (): void => {
    setLoaderVisible(false);
  };

  const appContent = appError ? (
    <ErrorView errorMessage={appError} />
  ) : (
    <MainNavigationContainer
      key={forceReload}
      homeStack={HomeStack}
      uploadStack={UploadStack}
      chartStack={ChartStack}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      {appContent}
      {loaderVisible && <LoadingOverlay onFinish={handleLoaderFinish} />}
    </View>
  );
}

const ErrorView = ({ errorMessage }: { errorMessage: string }) => (
  <View style={styles.centeredLoader}>
    <Text style={styles.errorText}>{errorMessage}</Text>
  </View>
);

interface MainNavigationContainerProps {
  homeStack: () => React.ReactElement;
  uploadStack: () => React.ReactElement;
  chartStack: () => React.ReactElement;
}

const MainNavigationContainer = ({
  homeStack,
  uploadStack,
  chartStack,
}: MainNavigationContainerProps) => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ProfileRequiredModal>
          <TabNavigator
            homeStack={homeStack}
            uploadStack={uploadStack}
            chartStack={chartStack}
          />
        </ProfileRequiredModal>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const TabNavigator = ({
  homeStack,
  uploadStack,
  chartStack,
}: MainNavigationContainerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) =>
        configureTabScreenOptions({ route, insets })
      }
    >
      <Tab.Screen name="Home" component={homeStack} />
      <Tab.Screen
        name="Upload"
        component={uploadStack}
        options={{
          tabBarLabel: " ",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="add-circle-outline" size={30} color={color} />
          ),
          tabBarButton: (props) => createUploadTabButton(props, insets),
        }}
      />
      <Tab.Screen name="Charts" component={chartStack} />
    </Tab.Navigator>
  );
};

const configureTabScreenOptions = ({
  route,
  insets,
}: {
  route: Route<keyof RootTabParamList>;
  insets: { bottom: number; top: number; left: number; right: number };
}): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: "#2c7be5",
  tabBarInactiveTintColor: "gray",
  headerShown: false,
  tabBarShowLabel: true,
  tabBarStyle: {
    ...styles.tabBar,
    height: Platform.OS === "android" ? 65 + insets.bottom : 65,
    paddingBottom: Platform.OS === "android" ? 5 + insets.bottom : 5,
  },
  tabBarIcon: ({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: string;
    size: number;
  }) => {
    return createTabBarIcon(route.name, focused, color, size);
  },
});

const createTabBarIcon = (
  routeName: string,
  focused: boolean,
  color: string,
  size: number
) => {
  let iconName: keyof typeof Ionicons.glyphMap | undefined;

  if (routeName === "Home") {
    iconName = focused ? "home" : "home-outline";
  } else if (routeName === "Charts") {
    iconName = focused ? "bar-chart" : "bar-chart-outline";
  }

  if (!iconName) return null;

  return <Ionicons name={iconName} size={size} color={color} />;
};

const createUploadTabButton = (
  props: BottomTabBarButtonProps,
  insets: { bottom: number; top: number; left: number; right: number }
) => (
  <TouchableOpacity
    {...(props as React.ComponentProps<typeof TouchableOpacity>)}
    style={[
      styles.uploadTabButton,
      Platform.OS === "android" && insets.bottom > 0
        ? {
            position: "absolute",
            top: -20,
          }
        : null,
    ]}
    activeOpacity={0.8}
  >
    <View style={styles.uploadTabButtonInner}>
      <Ionicons name="add" size={32} color="white" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
  },
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
  },
  logoContainer: {
    position: "relative",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircle: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
  loadingImage: {
    width: 160,
    height: 160,
    borderRadius: 100,
    zIndex: 5,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#5a7184",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#e63757",
    textAlign: "center",
    padding: 20,
  },
  headerButton: {
    marginRight: 15,
  },
  tabBar: {
    height: 65,
    paddingBottom: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  uploadTabButton: {
    top: -20,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2c7be5",
    elevation: 6,
    shadowColor: "#2c7be5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  uploadTabButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
});
