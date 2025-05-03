import './cryptoPolyfill';
import './streamPolyfill';

import React, { useState, useEffect } from 'react';
import { NavigationContainer, Route, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabNavigationOptions, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { ChartScreen } from './src/presentation/screens/ChartScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { UploadScreen } from './src/presentation/screens/UploadScreen';
import { SettingsScreen } from './src/presentation/screens/SettingsScreen';
import { GetAnalysesUseCase, GetAnalysisByIdUseCase, GetLabTestDataUseCase } from './src/application/usecases/GetAnalysesUseCase';
import { AnalyzePdfUseCase } from './src/application/usecases/AnalyzePdfUseCase';
import { SQLiteBiologicalAnalysisRepository } from './src/adapters/repositories/SQLiteBiologicalAnalysisRepository';
import { MistralOcrService } from './src/adapters/services/MistralOcrService';
import { initializeDatabase } from './src/infrastructure/database/DatabaseInitializer';
import { Ionicons } from '@expo/vector-icons';
import { UpdateAnalysisUseCase } from './src/application/usecases/UpdateAnalysisUseCase';
import { DeleteAnalysisUseCase } from './src/application/usecases/DeleteAnalysisUseCase';
import { Text, View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AnalysisDetailsScreen from './src/presentation/screens/AnalysisDetailsScreen';
import { SaveApiKeyUseCase } from './src/application/usecases/SaveApiKeyUseCase';
import { LoadApiKeyUseCase } from './src/application/usecases/LoadApiKeyUseCase';
import { DeleteApiKeyUseCase } from './src/application/usecases/DeleteApiKeyUseCase';
import { HemeaLogo } from './src/presentation/components';
import { CalculateStatisticsUseCase } from './src/application/usecases/CalculateStatisticsUseCase';
import { HomeStackParamList, ChartStackParamList, UploadStackParamList, RootTabParamList } from './src/types/navigation';

const HomeStackNavigator = createStackNavigator<HomeStackParamList>();
const ChartStackNavigator = createStackNavigator<ChartStackParamList>();
const UploadStackNavigator = createStackNavigator<UploadStackParamList>();

const Tab = createBottomTabNavigator<RootTabParamList>();

const SettingsButton = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Home', { screen: 'SettingsScreen' })} 
      style={styles.headerButton}
    >
      <Ionicons name="settings-outline" size={24} color="#2c7be5" />
    </TouchableOpacity>
  );
};

export default function App() {
  const [analyzePdfUseCase, setAnalyzePdfUseCase] = useState<AnalyzePdfUseCase | null>(null);
  const [getAnalysesUseCase, setGetAnalysesUseCase] = useState<GetAnalysesUseCase | null>(null);
  const [getAnalysisByIdUseCase, setGetAnalysisByIdUseCase] = useState<GetAnalysisByIdUseCase | null>(null);
  const [updateAnalysisUseCase, setUpdateAnalysisUseCase] = useState<UpdateAnalysisUseCase | null>(null);
  const [deleteAnalysisUseCase, setDeleteAnalysisUseCase] = useState<DeleteAnalysisUseCase | null>(null);
  const [saveApiKeyUseCase, setSaveApiKeyUseCase] = useState<SaveApiKeyUseCase | null>(null);
  const [loadApiKeyUseCase, setLoadApiKeyUseCase] = useState<LoadApiKeyUseCase | null>(null);
  const [deleteApiKeyUseCase, setDeleteApiKeyUseCase] = useState<DeleteApiKeyUseCase | null>(null);
  const [getLabTestDataUseCase, setGetLabTestDataUseCase] = useState<GetLabTestDataUseCase | null>(null);
  const [calculateStatisticsUseCase, setCalculateStatisticsUseCase] = useState<CalculateStatisticsUseCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [forceReload, setForceReload] = useState(0);

  useEffect(() => {
    initializeApplication();
  }, [forceReload]);

  const handleManualReload = () => {
    setForceReload(prev => prev + 1);
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
    setApiKeyError('API key not set. Please configure it in Settings.');
    setAnalyzePdfUseCase(null);
  };

  const handleApiKeySaved = async (apiKey: string) => {
    setApiKeyError(null);
    createOcrService(apiKey);
  };

  const initializeApplication = async () => {
    try {
      await initializeDatabase();
      const repository = createRepository();
      const loadApiKeyUseCase = createBasicUseCases(repository);
      await checkAndLoadApiKey();
    } catch (error) {
      handleInitializationError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRepository = () => {
    return new SQLiteBiologicalAnalysisRepository();
  };

  const createBasicUseCases = (repository: SQLiteBiologicalAnalysisRepository): LoadApiKeyUseCase => {
    const newGetAnalysesUseCase = new GetAnalysesUseCase(repository);
    const newGetAnalysisByIdUseCase = new GetAnalysisByIdUseCase(repository);
    const newUpdateAnalysisUseCase = new UpdateAnalysisUseCase(repository);
    const newDeleteAnalysisUseCase = new DeleteAnalysisUseCase(repository);
    const newGetLabTestDataUseCase = new GetLabTestDataUseCase();
    const newSaveApiKeyUseCase = new SaveApiKeyUseCase();
    const newLoadApiKeyUseCase = new LoadApiKeyUseCase();
    const newDeleteApiKeyUseCase = new DeleteApiKeyUseCase();
    const newCalculateStatisticsUseCase = new CalculateStatisticsUseCase();
    
    setGetAnalysesUseCase(newGetAnalysesUseCase);
    setGetAnalysisByIdUseCase(newGetAnalysisByIdUseCase);
    setUpdateAnalysisUseCase(newUpdateAnalysisUseCase);
    setDeleteAnalysisUseCase(newDeleteAnalysisUseCase);
    setGetLabTestDataUseCase(newGetLabTestDataUseCase);
    setSaveApiKeyUseCase(newSaveApiKeyUseCase);
    setLoadApiKeyUseCase(newLoadApiKeyUseCase);
    setDeleteApiKeyUseCase(newDeleteApiKeyUseCase);
    setCalculateStatisticsUseCase(newCalculateStatisticsUseCase);
    
    return newLoadApiKeyUseCase;
  };

  const createOcrService = (apiKey: string) => {
    const ocrService = new MistralOcrService(apiKey);
    const repository = new SQLiteBiologicalAnalysisRepository();
    setAnalyzePdfUseCase(new AnalyzePdfUseCase(ocrService, repository));
  };

  const handleMissingApiKey = () => {
    setApiKeyError('API key not set. Please configure it in Settings.');
    setAnalyzePdfUseCase(null);
  };

  const handleApiKeyLoadError = (error: any) => {
    setApiKeyError('Failed to load API key configuration.');
    setAnalyzePdfUseCase(null);
  };

  const handleInitializationError = (error: any) => {
    setAppError('Failed to initialize application. Please restart the app.');
  };

  function HomeStack() {
    return (
      <HomeStackNavigator.Navigator
         screenOptions={{ 
           headerShown: true, 
           headerBackTitle: ' ',
           headerLeftContainerStyle: { paddingLeft: 10 },
         }}
      >
        <HomeStackNavigator.Screen
          name="HomeScreen"
          options={{ 
            headerTitle: () => <HemeaLogo />,
            headerRight: () => <SettingsButton />, 
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, 'HomeScreen'>) => {
            if (!getAnalysesUseCase || !deleteAnalysisUseCase) {
              return <ErrorView errorMessage="Application is not properly initialized" />;
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
            headerTitle: 'Analysis Details',
            headerBackTitle: ' ',
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, 'AnalysisDetails'>) => {
            if (!getAnalysisByIdUseCase || !updateAnalysisUseCase) {
              return <ErrorView errorMessage="Application is not properly initialized" />;
            }
            
            return (
              <AnalysisDetailsScreen
                {...props}
                getAnalysisByIdUseCase={getAnalysisByIdUseCase}
                updateAnalysisUseCase={updateAnalysisUseCase}
              />
            );
          }}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="SettingsScreen"
          options={{ 
            headerTitle: 'Settings',
            headerBackTitle: ' ',
            headerLeftContainerStyle: { paddingLeft: 10 },
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, 'SettingsScreen'>) => {
            if (!saveApiKeyUseCase || !loadApiKeyUseCase || !deleteApiKeyUseCase) {
              return <ErrorView errorMessage="Application is not properly initialized" />;
            }
            
            return (
              <SettingsScreen 
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
      </HomeStackNavigator.Navigator>
    );
  }

  function ChartStack() {
    return (
      <ChartStackNavigator.Navigator 
        screenOptions={{
          headerShown: true,
          headerBackTitle: ' ',
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerTitleAlign: 'center',
        }}
      >
        <ChartStackNavigator.Screen
          name="ChartScreen"
          options={{ 
            headerTitle: () => <HemeaLogo />,
            headerRight: () => <SettingsButton />
          }}
        >
          {(props: StackScreenProps<ChartStackParamList, 'ChartScreen'>) => {
            if (!getAnalysesUseCase || !getLabTestDataUseCase || !calculateStatisticsUseCase) {
              return <ErrorView errorMessage="Application is not properly initialized" />;
            }
            
            return (
              <ChartScreen 
                {...props} 
                getAnalysesUseCase={getAnalysesUseCase} 
                getLabTestDataUseCase={getLabTestDataUseCase}
                calculateStatisticsUseCase={calculateStatisticsUseCase}
              />
            );
          }}
        </ChartStackNavigator.Screen>
      </ChartStackNavigator.Navigator>
    );
  }

  function UploadStack() {
    return (
      <UploadStackNavigator.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: ' ',
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerTitleAlign: 'center',
        }}
      >
        <UploadStackNavigator.Screen
          name="UploadScreen"
          options={{ 
            headerTitle: () => <HemeaLogo />,
            headerRight: () => <SettingsButton />
          }}
        >
          {(props: StackScreenProps<UploadStackParamList, 'UploadScreen'>) => (
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
  }

  if (isLoading) {
    return <LoadingView />;
  }

  if (appError) {
    return <ErrorView errorMessage={appError} />;
  }

  return <MainNavigationContainer 
    homeStack={HomeStack} 
    uploadStack={UploadStack} 
    chartStack={ChartStack} 
  />;
}

const LoadingView = () => (
  <View style={styles.centeredLoader}>
    <ActivityIndicator size="large" color="#2c7be5" />
    <Text style={styles.loadingText}>Loading application...</Text>
  </View>
);

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
  chartStack 
}: MainNavigationContainerProps) => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={configureTabScreenOptions}
    >
      <Tab.Screen name="Home" component={homeStack} />
      <Tab.Screen 
        name="Upload" 
        component={uploadStack}
        options={{
           tabBarLabel: ' ',
           tabBarIcon: ({ color }: { color: string }) => (
             <Ionicons name="add-circle-outline" size={30} color={color} /> 
          ),
           tabBarButton: createUploadTabButton,
        }} 
      />
      <Tab.Screen name="Charts" component={chartStack} />
    </Tab.Navigator>
  </NavigationContainer>
);

const configureTabScreenOptions = ({ route }: { route: Route<keyof RootTabParamList> }): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: '#2c7be5',
  tabBarInactiveTintColor: 'gray',
  headerShown: false,
  tabBarShowLabel: true,
  tabBarStyle: styles.tabBar,
  tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
    return createTabBarIcon(route.name, focused, color, size);
  },
});

const createTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName: keyof typeof Ionicons.glyphMap | undefined;

  if (routeName === 'Home') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (routeName === 'Charts') {
    iconName = focused ? 'bar-chart' : 'bar-chart-outline';
  } 
  
  if (!iconName) return null;

  return <Ionicons name={iconName} size={size} color={color} />;
};

const createUploadTabButton = (props: BottomTabBarButtonProps) => (
  <TouchableOpacity
    {...props as any}
    style={styles.uploadTabButton}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5a7184',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e63757',
    textAlign: 'center',
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
    borderTopColor: '#eee',
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  uploadTabButton: {
    top: -20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2c7be5',
    elevation: 6,
    shadowColor: '#2c7be5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  uploadTabButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
