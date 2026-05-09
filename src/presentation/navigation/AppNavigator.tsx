import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import {
  createStackNavigator,
  StackScreenProps,
  TransitionPresets,
} from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Screens
import { HomeScreen } from "../screens/home/HomeScreen";
import { UploadScreen } from "../screens/upload/UploadScreen";
import { AIImportScreen } from "../screens/upload/AIImportScreen";
import { ChartScreen } from "../screens/charts/ChartScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { ApiKeySettingsScreen } from "../screens/settings/ApiKeySettingsScreen";
import { DatabaseSettingsScreen } from "../screens/settings/DatabaseSettingsScreen";
import { ProfileScreen } from "../screens/settings/ProfileScreen";
import { HelpCenterScreen } from "../screens/settings/HelpCenterScreen";
import { PrivacySecurityScreen } from "../screens/settings/PrivacySecurityScreen";
import { AboutScreen } from "../screens/settings/AboutScreen";
import { PrivacyPolicyWebViewScreen } from "../screens/settings/PrivacyPolicyWebViewScreen";
import { MistralApiKeyTutorialScreen } from "../screens/settings/MistralApiKeyTutorialScreen";
import { SyncScreen } from "../screens/settings/SyncScreen";
import AnalysisDetailsScreen from "../screens/home/AnalysisDetailsScreen";
import { AllAnalysesScreen } from "../screens/home/AllAnalysesScreen";

import {
  HemeaLogo,
  TabLayout,
  ProfileRequiredModal,
  TimeRangeProvider,
} from "../components";
import { TabBarProvider } from "../contexts/TabBarContext";

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
import { GetReferenceRangeUseCase } from "../../domain/usecases/GetReferenceRangeUseCase";
import { CreateAnalysisUseCase } from "../../domain/usecases/CreateAnalysisUseCase";
import { CreateManualAnalysisUseCase } from "../../domain/usecases/CreateManualAnalysisUseCase";
import { GetPinnedMetricsUseCase } from "../../domain/usecases/GetPinnedMetricsUseCase";
import { SavePinnedMetricsUseCase } from "../../domain/usecases/SavePinnedMetricsUseCase";
import { CalculateHealthMagnitudeUseCase } from "../../domain/usecases/CalculateHealthMagnitudeUseCase";
import { RetrieveUserProfileUseCase } from "../../domain/usecases/RetrieveUserProfileUseCase";
import { GetUserAgeUseCase } from "../../domain/usecases/GetUserAgeUseCase";

import { ProfileService } from "../../domain/services/ProfileService";

import {
  HomeStackParamList,
  ChartStackParamList,
  UploadStackParamList,
} from "../../types/navigation";
import { colorPalette, theme } from "../../config/themes";

const HomeStackNavigator = createStackNavigator<HomeStackParamList>();
const ChartStackNavigator = createStackNavigator<ChartStackParamList>();
const UploadStackNavigator = createStackNavigator<UploadStackParamList>();

export interface AppNavigatorProps {
  getAnalysesUseCase: GetAnalysesUseCase | null;
  getAnalysisByIdUseCase: GetAnalysisByIdUseCase | null;
  updateAnalysisUseCase: UpdateAnalysisUseCase | null;
  deleteAnalysisUseCase: DeleteAnalysisUseCase | null;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  saveApiKeyUseCase: SaveApiKeyUseCase | null;
  loadApiKeyUseCase: LoadApiKeyUseCase | null;
  deleteApiKeyUseCase: DeleteApiKeyUseCase | null;
  getLabTestDataUseCase: GetLabTestDataUseCase | null;
  calculateStatisticsUseCase: CalculateStatisticsUseCase | null;
  resetDatabaseUseCase: ResetDatabaseUseCase | null;
  getReferenceRangeUseCase: GetReferenceRangeUseCase | null;
  getPinnedMetricsUseCase: GetPinnedMetricsUseCase | null;
  savePinnedMetricsUseCase: SavePinnedMetricsUseCase | null;
  calculateHealthMagnitudeUseCase: CalculateHealthMagnitudeUseCase | null;
  retrieveUserProfileUseCase: RetrieveUserProfileUseCase | null;
  getUserAgeUseCase: GetUserAgeUseCase | null;
  createAnalysisUseCase: CreateAnalysisUseCase | null;
  createManualAnalysisUseCase: CreateManualAnalysisUseCase | null;
  isLoading: boolean;
  apiKeyError: string | null;
  appError: string | null;
  forceReload: number;
  onApiKeyDeleted: () => void;
  onApiKeySaved: (apiKey: string) => Promise<void>;
  onManualReload: () => void;
  checkAndLoadApiKey: () => Promise<void>;
}

type NavigateToSettingsFunction = () => void;

const SettingsButton = (): React.ReactElement => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  const navigateToSettings: NavigateToSettingsFunction = () =>
    navigation.navigate("Home", { screen: "SettingsScreen" });

  return (
    <TouchableOpacity onPress={navigateToSettings} style={styles.headerButton}>
      <Ionicons
        name="settings-outline"
        size={24}
        color={theme.buttons.info.backgroundColor}
      />
    </TouchableOpacity>
  );
};

const ErrorView = ({
  errorMessage,
}: {
  errorMessage: string;
}): React.ReactElement => (
  <View style={styles.centeredLoader}>
    <Text style={styles.errorText}>{errorMessage}</Text>
  </View>
);

export const AppNavigator: React.FC<AppNavigatorProps> = React.memo(
  ({
    getAnalysesUseCase,
    getAnalysisByIdUseCase,
    updateAnalysisUseCase,
    deleteAnalysisUseCase,
    analyzePdfUseCase,
    saveApiKeyUseCase,
    loadApiKeyUseCase,
    deleteApiKeyUseCase,
    getLabTestDataUseCase,
    calculateStatisticsUseCase,
    resetDatabaseUseCase,
    getReferenceRangeUseCase,
    getPinnedMetricsUseCase,
    savePinnedMetricsUseCase,
    calculateHealthMagnitudeUseCase,
    retrieveUserProfileUseCase,
    getUserAgeUseCase,
    createAnalysisUseCase,
    createManualAnalysisUseCase,
    isLoading,
    apiKeyError,
    appError,
    forceReload,
    onApiKeyDeleted,
    onApiKeySaved,
    onManualReload,
    checkAndLoadApiKey,
  }) => {
    const createHomeStack = React.useMemo((): (() => React.ReactElement) => {
      const HomeStackComponent = (): React.ReactElement => (
        <HomeStackNavigator.Navigator
          screenOptions={{
            headerShown: true,
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: colorPalette.neutral.white,
              shadowColor: colorPalette.neutral.main,
              shadowOpacity: 0.1,
            },
            headerTintColor: theme.buttons.info.backgroundColor,
            gestureEnabled: true,
            gestureResponseDistance: 50,
            ...TransitionPresets.SlideFromRightIOS,
            transitionSpec: {
              open: {
                animation: "timing",
                config: {
                  duration: 300,
                },
              },
              close: {
                animation: "timing",
                config: {
                  duration: 300,
                },
              },
            },
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
                overlayStyle: {
                  opacity: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                    extrapolate: "clamp",
                  }),
                },
              };
            },
            headerStyleInterpolator: ({ current, layouts }) => {
              return {
                leftLabelStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
                titleStyle: {
                  opacity: current.progress.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 0, 1, 1],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width * 0.1, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
                backgroundStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <HomeStackNavigator.Screen
            name="HomeScreen"
            options={{
              headerTitle: "",
              headerRight: () => <SettingsButton />,
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: colorPalette.neutral.white,
                shadowOpacity: 0,
                elevation: 0,
              },
            }}
          >
            {(props: StackScreenProps<HomeStackParamList, "HomeScreen">) => {
              if (
                !getAnalysesUseCase ||
                !getLabTestDataUseCase ||
                !calculateStatisticsUseCase ||
                !getReferenceRangeUseCase ||
                !getPinnedMetricsUseCase ||
                !savePinnedMetricsUseCase ||
                !calculateHealthMagnitudeUseCase ||
                !retrieveUserProfileUseCase ||
                !getUserAgeUseCase
              ) {
                return (
                  <ErrorView errorMessage="Required services are not available for Home." />
                );
              }
              return (
                <HomeScreen
                  {...props}
                  getAnalysesUseCase={getAnalysesUseCase}
                  getLabTestDataUseCase={getLabTestDataUseCase}
                  calculateStatisticsUseCase={calculateStatisticsUseCase}
                  getReferenceRangeUseCase={getReferenceRangeUseCase}
                  getPinnedMetricsUseCase={getPinnedMetricsUseCase}
                  savePinnedMetricsUseCase={savePinnedMetricsUseCase}
                  calculateHealthMagnitudeUseCase={
                    calculateHealthMagnitudeUseCase
                  }
                  retrieveUserProfileUseCase={retrieveUserProfileUseCase}
                  getUserAgeUseCase={getUserAgeUseCase}
                />
              );
            }}
          </HomeStackNavigator.Screen>
          <HomeStackNavigator.Screen
            name="AllAnalysesScreen"
            options={{
              headerTitle: "All Analyses",
              headerBackTitle: " ",
              headerLeftContainerStyle: { paddingLeft: 10 },
            }}
          >
            {(
              props: StackScreenProps<HomeStackParamList, "AllAnalysesScreen">
            ) => {
              if (!getAnalysesUseCase || !deleteAnalysisUseCase) {
                return (
                  <ErrorView errorMessage="Application is not properly initialized" />
                );
              }
              return (
                <AllAnalysesScreen
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
            {(
              props: StackScreenProps<HomeStackParamList, "AnalysisDetails">
            ) => {
              if (
                !getAnalysisByIdUseCase ||
                !updateAnalysisUseCase ||
                !deleteAnalysisUseCase ||
                !getReferenceRangeUseCase
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
                  deleteAnalysisUseCase={deleteAnalysisUseCase}
                  getReferenceRangeUseCase={getReferenceRangeUseCase}
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
            {(
              props: StackScreenProps<HomeStackParamList, "SettingsScreen">
            ) => {
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
              return <SettingsScreen {...props} />;
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
              props: StackScreenProps<
                HomeStackParamList,
                "ApiKeySettingsScreen"
              >
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
                  onApiKeyDeleted={onApiKeyDeleted}
                  onApiKeySaved={onApiKeySaved}
                  onManualReload={onManualReload}
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
                  onManualReload={onManualReload}
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
          <HomeStackNavigator.Screen
            name="SyncScreen"
            options={{
              headerTitle: "Device Sync",
              headerBackTitle: " ",
              headerLeftContainerStyle: { paddingLeft: 10 },
            }}
            component={SyncScreen}
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
      getReferenceRangeUseCase,
      getPinnedMetricsUseCase,
      savePinnedMetricsUseCase,
      calculateHealthMagnitudeUseCase,
      retrieveUserProfileUseCase,
      getUserAgeUseCase,
      onApiKeyDeleted,
      onApiKeySaved,
      onManualReload,
    ]);

    const createChartStack = React.useMemo((): (() => React.ReactElement) => {
      const ChartStackComponent = (): React.ReactElement => (
        <ChartStackNavigator.Navigator
          screenOptions={{
            headerShown: true,
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: colorPalette.neutral.white,
              shadowColor: colorPalette.neutral.main,
              shadowOpacity: 0.1,
            },
            headerTintColor: theme.buttons.info.backgroundColor,
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
                !getReferenceRangeUseCase
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
                  getReferenceRangeUseCase={getReferenceRangeUseCase}
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
      getReferenceRangeUseCase,
    ]);

    const createUploadStack = React.useMemo((): (() => React.ReactElement) => {
      const UploadStackComponent = (): React.ReactElement => (
        <UploadStackNavigator.Navigator
          screenOptions={{
            headerShown: true,
            headerBackTitle: " ",
            headerLeftContainerStyle: { paddingLeft: 10 },
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: colorPalette.neutral.white,
              shadowColor: colorPalette.neutral.main,
              shadowOpacity: 0.1,
            },
            headerTintColor: theme.buttons.info.backgroundColor,
          }}
        >
          <UploadStackNavigator.Screen
            name="UploadScreen"
            options={{
              headerTitle: () => <HemeaLogo />,
              headerRight: () => <SettingsButton />,
            }}
          >
            {(
              props: StackScreenProps<UploadStackParamList, "UploadScreen">
            ) => {
              if (!createAnalysisUseCase || !getReferenceRangeUseCase) {
                return (
                  <ErrorView errorMessage="Application is not properly initialized" />
                );
              }
              return (
                <UploadScreen
                  {...props}
                  createAnalysisUseCase={createAnalysisUseCase}
                  createManualAnalysisUseCase={createManualAnalysisUseCase}
                  getReferenceRangeUseCase={getReferenceRangeUseCase}
                />
              );
            }}
          </UploadStackNavigator.Screen>

          <UploadStackNavigator.Screen
            name="AIImportScreen"
            options={{
              headerTitle: "Import par IA",
              headerRight: () => <SettingsButton />,
            }}
          >
            {(
              props: StackScreenProps<UploadStackParamList, "AIImportScreen">
            ) => (
              <AIImportScreen
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
    }, [
      analyzePdfUseCase,
      isLoading,
      apiKeyError,
      checkAndLoadApiKey,
      createAnalysisUseCase,
      createManualAnalysisUseCase,
      getReferenceRangeUseCase,
    ]);

    if (appError) {
      return <ErrorView errorMessage={appError} />;
    }

    return (
      <SafeAreaProvider>
        <NavigationContainer key={forceReload}>
          <ProfileRequiredModal profileService={ProfileService.getInstance()}>
            <TimeRangeProvider>
              <TabBarProvider>
                <TabLayout
                  homeStack={createHomeStack}
                  uploadStack={createUploadStack}
                  chartStack={createChartStack}
                />
              </TabBarProvider>
            </TimeRangeProvider>
          </ProfileRequiredModal>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }
);

AppNavigator.displayName = "AppNavigator";

const styles = StyleSheet.create({
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colorPalette.neutral.light,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colorPalette.primary.main,
    textAlign: "center",
    padding: 20,
  },
  headerButton: {
    marginRight: 15,
  },
});
