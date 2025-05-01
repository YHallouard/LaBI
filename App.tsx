// Import crypto polyfill before anything else
import './cryptoPolyfill';
// Import stream polyfill for ReadableStream support
import './streamPolyfill';

import React, { useState, useEffect } from 'react';
import { NavigationContainer, Route, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabNavigationOptions, BottomTabBarButtonProps, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationOptions, StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { ChartScreen } from './src/presentation/screens/ChartScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { UploadScreen } from './src/presentation/screens/UploadScreen';
import { SettingsScreen } from './src/presentation/screens/SettingsScreen';
import { GetAnalysesUseCase, GetAnalysisByIdUseCase } from './src/application/usecases/GetAnalysesUseCase';
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

// Define Param Lists
export type HomeStackParamList = {
  HomeScreen: undefined;
  AnalysisDetails: { analysisId: string };
  SettingsScreen: undefined; // Settings moved here
};

export type ChartStackParamList = {
  ChartScreen: undefined;
};

export type UploadStackParamList = {
  UploadScreen: undefined;
};

// Main Bottom Tab Param List
export type RootTabParamList = {
  Home: undefined; // Corresponds to HomeStack
  Upload: undefined; // Corresponds to UploadStack
  Charts: undefined; // Corresponds to ChartStack
};

// Type for Stack Navigators
const HomeStackNavigator = createStackNavigator<HomeStackParamList>();
const ChartStackNavigator = createStackNavigator<ChartStackParamList>();
const UploadStackNavigator = createStackNavigator<UploadStackParamList>();

// Type for Bottom Tab Navigator
const Tab = createBottomTabNavigator<RootTabParamList>();

// Remove global initialization - we'll only do it inside the component
console.log('Starting app initialization');

// Helper function for the Settings Button JSX
const SettingsButton = () => {
  // Use the useNavigation hook to get the navigation object regardless of stack context
  const navigation = useNavigation<StackNavigationProp<any>>(); // Use a generic type or define a combined param list type if needed
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
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Unified initialization in a single useEffect
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        
        // Create repository
        console.log('Creating repository...');
        const repository = new SQLiteBiologicalAnalysisRepository();
        
        // Create use cases
        console.log('Creating use cases...');
        const newGetAnalysesUseCase = new GetAnalysesUseCase(repository);
        const newGetAnalysisByIdUseCase = new GetAnalysisByIdUseCase(repository);
        const newUpdateAnalysisUseCase = new UpdateAnalysisUseCase(repository);
        const newDeleteAnalysisUseCase = new DeleteAnalysisUseCase(repository);
        const newSaveApiKeyUseCase = new SaveApiKeyUseCase();
        const newLoadApiKeyUseCase = new LoadApiKeyUseCase();
        
        // Set them in state
        setGetAnalysesUseCase(newGetAnalysesUseCase);
        setGetAnalysisByIdUseCase(newGetAnalysisByIdUseCase);
        setUpdateAnalysisUseCase(newUpdateAnalysisUseCase);
        setDeleteAnalysisUseCase(newDeleteAnalysisUseCase);
        setSaveApiKeyUseCase(newSaveApiKeyUseCase);
        setLoadApiKeyUseCase(newLoadApiKeyUseCase);
        
        // Load API key with our newly created use case
        console.log('Loading API key...');
        try {
          const loadedApiKey = await newLoadApiKeyUseCase.execute();
          
          if (loadedApiKey) {
            console.log('API key found');
            const ocrService = new MistralOcrService(loadedApiKey);
            setAnalyzePdfUseCase(new AnalyzePdfUseCase(ocrService, repository));
          } else {
            console.warn('API key not found. OCR features disabled.');
            setApiKeyError('API key not set. Please configure it in Settings.');
            // Still create OCR service but it won't work until key is set
            const ocrService = new MistralOcrService("");
            setAnalyzePdfUseCase(new AnalyzePdfUseCase(ocrService, repository));
          }
        } catch (error) {
          console.error("Error during API key loading:", error);
          setApiKeyError('Failed to load API key configuration.');
          // Still create OCR service but it won't work until key is set
          const ocrService = new MistralOcrService("");
          setAnalyzePdfUseCase(new AnalyzePdfUseCase(ocrService, repository));
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error during app initialization:', error);
        setAppError('Failed to initialize application. Please restart the app.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // --- Navigation Stacks ---
  function HomeStack() {
    return (
      <HomeStackNavigator.Navigator
         screenOptions={{ 
           headerShown: true, 
         }}
      >
        <HomeStackNavigator.Screen
          name="HomeScreen"
          options={{ 
            headerTitle: 'Home',
            headerRight: () => <SettingsButton />, 
          }}
        >
          {(props: StackScreenProps<HomeStackParamList, 'HomeScreen'>) => 
            <HomeScreen 
              {...props} 
              getAnalysesUseCase={getAnalysesUseCase}
              deleteAnalysisUseCase={deleteAnalysisUseCase}
            />
          }
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="AnalysisDetails"
          options={{ headerTitle: 'Analysis Details' }}
        >
          {(props: StackScreenProps<HomeStackParamList, 'AnalysisDetails'>) => (
            <AnalysisDetailsScreen
              {...props}
              getAnalysisByIdUseCase={getAnalysisByIdUseCase}
              updateAnalysisUseCase={updateAnalysisUseCase}
            />
          )}
        </HomeStackNavigator.Screen>
        <HomeStackNavigator.Screen
          name="SettingsScreen"
          options={{ headerTitle: 'Settings' }}
         >
           {(props: StackScreenProps<HomeStackParamList, 'SettingsScreen'>) => (
             <SettingsScreen 
               {...props} 
               saveApiKeyUseCase={saveApiKeyUseCase} 
               loadApiKeyUseCase={loadApiKeyUseCase} 
             />
           )}
        </HomeStackNavigator.Screen>
      </HomeStackNavigator.Navigator>
    );
  }

  function ChartStack() {
    return (
      <ChartStackNavigator.Navigator 
        screenOptions={{
          headerShown: true,
          headerRight: () => <SettingsButton />, 
        }}
      >
        <ChartStackNavigator.Screen
          name="ChartScreen"
          options={{ headerTitle: 'Charts' }}
        >
          {(props: StackScreenProps<ChartStackParamList, 'ChartScreen'>) => 
            <ChartScreen {...props} getAnalysesUseCase={getAnalysesUseCase} />
          }
        </ChartStackNavigator.Screen>
      </ChartStackNavigator.Navigator>
    );
  }

  function UploadStack() {
    return (
      <UploadStackNavigator.Navigator
        screenOptions={{
          headerShown: true,
          headerRight: () => <SettingsButton />,
        }}
      >
        <UploadStackNavigator.Screen
          name="UploadScreen"
          options={{ headerTitle: 'Upload Report' }}
        >
          {(props: StackScreenProps<UploadStackParamList, 'UploadScreen'>) => (
            <UploadScreen
              {...props}
              analyzePdfUseCase={analyzePdfUseCase}
              isLoadingApiKey={isLoading}
              apiKeyError={apiKeyError}
            />
          )}
        </UploadStackNavigator.Screen>
      </UploadStackNavigator.Navigator>
    );
  }
  // --- End Navigation Stacks ---

  // Show loading indicator while app is initializing
  if (isLoading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color="#2c7be5" />
        <Text style={styles.loadingText}>Loading application...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (appError) {
    return (
      <View style={styles.centeredLoader}>
        <Text style={styles.errorText}>{appError}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }: { route: Route<keyof RootTabParamList> }): BottomTabNavigationOptions => ({
          tabBarActiveTintColor: '#2c7be5',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
            let iconName: keyof typeof Ionicons.glyphMap | undefined;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Charts') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } 
            
            if (!iconName) return null;

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen 
          name="Upload" 
          component={UploadStack}
          options={{
             tabBarLabel: ' ',
             tabBarIcon: ({ color }: { color: string }) => (
               <Ionicons name="add-circle-outline" size={30} color={color} /> 
            ),
             tabBarButton: (props: BottomTabBarButtonProps) => (
              <TouchableOpacity
                {...props}
                style={styles.uploadTabButton}
                activeOpacity={0.8}
              >
                <View style={styles.uploadTabButtonInner}> 
                   <Ionicons name="add" size={32} color="white" />
                 </View>
              </TouchableOpacity>
            ),
          }} 
        />
        <Tab.Screen name="Charts" component={ChartStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

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
