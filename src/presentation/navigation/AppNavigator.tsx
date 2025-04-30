import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, RootTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { GetAnalysesUseCase } from '../../application/usecases/GetAnalysesUseCase';
import { AnalyzePdfUseCase } from '../../application/usecases/AnalyzePdfUseCase';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';
import { OcrService } from '../../ports/services/OcrService';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  biologicalAnalysisRepository: BiologicalAnalysisRepository;
  ocrService: OcrService;
};

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  biologicalAnalysisRepository,
  ocrService
}) => {
  // Initialize use cases
  const getAnalysesUseCase = new GetAnalysesUseCase(biologicalAnalysisRepository);
  const analyzePdfUseCase = new AnalyzePdfUseCase(ocrService, biologicalAnalysisRepository);

  const HomeStack = () => (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        options={{ title: 'My Analyses' }}
      >
        {props => <HomeScreen {...props} getAnalysesUseCase={getAnalysesUseCase} />}
      </Stack.Screen>
      <Stack.Screen 
        name="AnalysisDetails" 
        options={{ title: 'Analysis Details' }}
      >
        {/* Add AnalysisDetails screen later if needed */}
        {props => <HomeScreen {...props} getAnalysesUseCase={getAnalysesUseCase} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;
            
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Upload') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Charts') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else {
              iconName = 'help-circle-outline';
            }
            
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2c7be5',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack} 
          options={{ headerShown: false }}
        />
        <Tab.Screen 
          name="Upload" 
          options={{ title: 'Upload Report', headerShown: true }}
        >
          {props => <UploadScreen {...props} analyzePdfUseCase={analyzePdfUseCase} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Charts" 
          options={{ title: 'Analysis Charts' }}
        >
          {props => <ChartScreen getAnalysesUseCase={getAnalysesUseCase} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 