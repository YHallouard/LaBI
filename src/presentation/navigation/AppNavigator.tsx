import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList, RootTabParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { UploadScreen } from "../screens/UploadScreen";
import { ChartScreen } from "../screens/ChartScreen";
import {
  GetAnalysesUseCase,
  GetLabTestDataUseCase,
} from "../../application/usecases/GetAnalysesUseCase";
import { AnalyzePdfUseCase } from "../../application/usecases/AnalyzePdfUseCase";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { OcrService } from "../../ports/services/OcrService";
import AnalysisDetailsScreen from "../screens/AnalysisDetailsScreen";
import { GetAnalysisByIdUseCase } from "../../application/usecases/GetAnalysesUseCase";
import { UpdateAnalysisUseCase } from "../../application/usecases/UpdateAnalysisUseCase";
import { DeleteAnalysisUseCase } from "../../application/usecases/DeleteAnalysisUseCase";
import { CalculateStatisticsUseCase } from "../../application/usecases/CalculateStatisticsUseCase";
import { RepositoryFactory } from "../../infrastructure/repositories/RepositoryFactory";
import { GetReferenceRangeUseCase } from "../../application/usecases/GetReferenceRangeUseCase";
import { ReferenceRangeCalculator } from "../../domain/services/ReferenceRangeCalculator";
import { Alert } from "react-native";
import { colorPalette } from "../../config/themes";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [useCases, setUseCases] = useState<AppUseCases | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Use the repository factory to get encrypted repository
        const repository = await RepositoryFactory.getBiologicalAnalysisRepository();
        const userProfileRepository = await RepositoryFactory.getUserProfileRepository();
        
        // Create the reference range calculator and service
        const referenceRangeCalculator = new ReferenceRangeCalculator();
        const getReferenceRangeUseCase = new GetReferenceRangeUseCase(
          referenceRangeCalculator,
          userProfileRepository
        );
        
        await getReferenceRangeUseCase.initialize();
        
        const appUseCases = initializeUseCases(repository, null, getReferenceRangeUseCase);
        setUseCases(appUseCases);
      } catch (error) {
        console.error("Error initializing app:", error);
        Alert.alert(
          "Initialization Error",
          "There was a problem starting the app. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={configureTabScreenOptions}>
        <Tab.Screen
          name="Home"
          component={renderHomeStack(useCases)}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Upload"
          options={{ title: "Upload Report", headerShown: true }}
        >
          {(props) => (
            <UploadScreen
              {...props}
              analyzePdfUseCase={useCases?.analyzePdfUseCase || null}
              isLoadingApiKey={false}
              apiKeyError={"API key not configured. Please set up your API key in Settings."}
              checkAndLoadApiKey={async () => Promise.resolve()}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Charts" options={{ title: "Analysis Charts" }}>
          {(props) => (
            useCases ? (
              <ChartScreen
                {...props}
                getAnalysesUseCase={useCases.getAnalysesUseCase}
                getLabTestDataUseCase={useCases.getLabTestDataUseCase}
                calculateStatisticsUseCase={useCases.calculateStatisticsUseCase}
                getReferenceRangeUseCase={useCases.getReferenceRangeUseCase}
              />
            ) : (
              <></>
            )
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

interface AppUseCases {
  getAnalysesUseCase: GetAnalysesUseCase;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  getAnalysisByIdUseCase: GetAnalysisByIdUseCase;
  updateAnalysisUseCase: UpdateAnalysisUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  getLabTestDataUseCase: GetLabTestDataUseCase;
  calculateStatisticsUseCase: CalculateStatisticsUseCase;
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
}

const initializeUseCases = (
  repository: BiologicalAnalysisRepository,
  ocrService: OcrService | null,
  getReferenceRangeUseCase: GetReferenceRangeUseCase
): AppUseCases => {
  const getAnalysesUseCase = new GetAnalysesUseCase(repository);
  const analyzePdfUseCase = ocrService ? new AnalyzePdfUseCase(ocrService, repository) : null;
  const getAnalysisByIdUseCase = new GetAnalysisByIdUseCase(repository);
  const updateAnalysisUseCase = new UpdateAnalysisUseCase(repository);
  const deleteAnalysisUseCase = new DeleteAnalysisUseCase(repository);
  const getLabTestDataUseCase = new GetLabTestDataUseCase();
  const calculateStatisticsUseCase = new CalculateStatisticsUseCase();

  return {
    getAnalysesUseCase,
    analyzePdfUseCase,
    getAnalysisByIdUseCase,
    updateAnalysisUseCase,
    deleteAnalysisUseCase,
    getLabTestDataUseCase,
    calculateStatisticsUseCase,
    getReferenceRangeUseCase,
  };
};

const renderHomeStack = (useCases: AppUseCases | null) => {
  if (!useCases) return () => null;

  const HomeStackComponent = () => (
    <Stack.Navigator>
      <Stack.Screen name="Home" options={{ title: "My Analyses" }}>
        {(props) => (
          <HomeScreen
            {...props}
            getAnalysesUseCase={useCases.getAnalysesUseCase}
            deleteAnalysisUseCase={useCases.deleteAnalysisUseCase}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AnalysisDetails"
        options={{ title: "Analysis Details" }}
      >
        {(props) => (
          <AnalysisDetailsScreen
            {...props}
            getAnalysisByIdUseCase={useCases.getAnalysisByIdUseCase}
            updateAnalysisUseCase={useCases.updateAnalysisUseCase}
            getReferenceRangeUseCase={useCases.getReferenceRangeUseCase}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );

  HomeStackComponent.displayName = "HomeStackComponent";
  return HomeStackComponent;
};

const configureTabScreenOptions = ({ route }: { route: { name: string } }) => ({
  tabBarIcon: ({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: string;
    size: number;
  }) => {
    return createTabIcon(route.name, focused, color, size);
  },
  tabBarActiveTintColor: colorPalette.primary.main,
  tabBarInactiveTintColor: colorPalette.neutral.light,
});

const createTabIcon = (
  routeName: string,
  focused: boolean,
  color: string,
  size: number
) => {
  const iconName = getIconNameForRoute(routeName, focused);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Ionicons name={iconName as any} size={size} color={color} />;
};

const getIconNameForRoute = (routeName: string, focused: boolean): string => {
  if (routeName === "Home") {
    return focused ? "home" : "home-outline";
  } else if (routeName === "Upload") {
    return focused ? "add-circle" : "add-circle-outline";
  } else if (routeName === "Charts") {
    return focused ? "bar-chart" : "bar-chart-outline";
  }
  return "help-circle-outline";
};
