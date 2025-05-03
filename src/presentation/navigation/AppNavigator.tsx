import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, RootTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { GetAnalysesUseCase, GetLabTestDataUseCase } from '../../application/usecases/GetAnalysesUseCase';
import { AnalyzePdfUseCase } from '../../application/usecases/AnalyzePdfUseCase';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';
import { OcrService } from '../../ports/services/OcrService';
import AnalysisDetailsScreen from '../screens/AnalysisDetailsScreen';
import { GetAnalysisByIdUseCase } from '../../application/usecases/GetAnalysesUseCase';
import { UpdateAnalysisUseCase } from '../../application/usecases/UpdateAnalysisUseCase';
import { DeleteAnalysisUseCase } from '../../application/usecases/DeleteAnalysisUseCase';
import { CalculateStatisticsUseCase } from '../../application/usecases/CalculateStatisticsUseCase';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  biologicalAnalysisRepository: BiologicalAnalysisRepository;
  ocrService: OcrService;
  isLoadingApiKey: boolean;
  apiKeyError: string | null;
};

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  biologicalAnalysisRepository,
  ocrService,
  isLoadingApiKey,
  apiKeyError
}) => {
  const useCases = initializeUseCases(biologicalAnalysisRepository, ocrService);

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
          options={{ title: 'Upload Report', headerShown: true }}
        >
          {props => (
            <UploadScreen 
              {...props} 
              analyzePdfUseCase={useCases.analyzePdfUseCase}
              isLoadingApiKey={isLoadingApiKey} 
              apiKeyError={apiKeyError} 
              checkAndLoadApiKey={async () => Promise.resolve()}
            />
          )}
        </Tab.Screen>
        <Tab.Screen 
          name="Charts" 
          options={{ title: 'Analysis Charts' }}
        >
          {props => (
            <ChartScreen 
              getAnalysesUseCase={useCases.getAnalysesUseCase} 
              getLabTestDataUseCase={useCases.getLabTestDataUseCase} 
              calculateStatisticsUseCase={useCases.calculateStatisticsUseCase} 
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

interface AppUseCases {
  getAnalysesUseCase: GetAnalysesUseCase;
  analyzePdfUseCase: AnalyzePdfUseCase;
  getAnalysisByIdUseCase: GetAnalysisByIdUseCase;
  updateAnalysisUseCase: UpdateAnalysisUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  getLabTestDataUseCase: GetLabTestDataUseCase;
  calculateStatisticsUseCase: CalculateStatisticsUseCase;
}

const initializeUseCases = (
  repository: BiologicalAnalysisRepository,
  ocrService: OcrService
): AppUseCases => {
  const getAnalysesUseCase = new GetAnalysesUseCase(repository);
  const analyzePdfUseCase = new AnalyzePdfUseCase(ocrService, repository);
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
    calculateStatisticsUseCase
  };
};

const renderHomeStack = (useCases: AppUseCases) => () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      options={{ title: 'My Analyses' }}
    >
      {props => (
        <HomeScreen 
          {...props} 
          getAnalysesUseCase={useCases.getAnalysesUseCase} 
          deleteAnalysisUseCase={useCases.deleteAnalysisUseCase} 
        />
      )}
    </Stack.Screen>
    <Stack.Screen 
      name="AnalysisDetails" 
      options={{ title: 'Analysis Details' }}
    >
      {props => (
        <AnalysisDetailsScreen 
          {...props} 
          getAnalysisByIdUseCase={useCases.getAnalysisByIdUseCase} 
          updateAnalysisUseCase={useCases.updateAnalysisUseCase} 
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

const configureTabScreenOptions = ({ route }: { route: { name: string } }) => ({
  tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
    return createTabIcon(route.name, focused, color, size);
  },
  tabBarActiveTintColor: '#2c7be5',
  tabBarInactiveTintColor: 'gray',
});

const createTabIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  const iconName = getIconNameForRoute(routeName, focused);
  return <Ionicons name={iconName as any} size={size} color={color} />;
};

const getIconNameForRoute = (routeName: string, focused: boolean): string => {
  if (routeName === 'Home') {
    return focused ? 'home' : 'home-outline';
  } else if (routeName === 'Upload') {
    return focused ? 'add-circle' : 'add-circle-outline';
  } else if (routeName === 'Charts') {
    return focused ? 'bar-chart' : 'bar-chart-outline';
  }
  return 'help-circle-outline';
};
