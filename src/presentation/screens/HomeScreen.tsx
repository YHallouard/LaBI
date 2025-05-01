import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  Button, 
  Alert, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { GetAnalysesUseCase } from '../../application/usecases/GetAnalysesUseCase';
import { DeleteAnalysisUseCase } from '../../application/usecases/DeleteAnalysisUseCase';
import { AnalysisCard } from '../components/AnalysisCard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenProps = {
  getAnalysesUseCase: GetAnalysesUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  navigation, 
  getAnalysesUseCase,
  deleteAnalysisUseCase
}) => {
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeSwipeable, setActiveSwipeable] = useState<Swipeable | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async (refresh: boolean = false): Promise<void> => {
    if (!refresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      console.log('HomeScreen: About to execute getAnalysesUseCase.execute()');
      const result = await getAnalysesUseCase.execute();
      console.log('HomeScreen: Received results from UseCase:', result.length);
      const sortedAnalyses = [...result].sort((a, b) => b.date.getTime() - a.date.getTime());
      setAnalyses(sortedAnalyses); 
      setError(null);
    } catch (err) {
      console.error('HomeScreen: Failed to load analyses:', err);
      setError('Failed to load analyses');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('HomeScreen: Refresh triggered');
    loadAnalyses(true);
  };

  const handleAnalysisPress = (analysis: BiologicalAnalysis): void => {
    navigation.navigate('AnalysisDetails', { analysisId: analysis.id });
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      await deleteAnalysisUseCase.execute(analysisId);
      // Update the list
      setAnalyses(prevAnalyses => prevAnalyses.filter(analysis => analysis.id !== analysisId));
      if (activeSwipeable) {
        activeSwipeable.close();
        setActiveSwipeable(null);
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      Alert.alert('Error', 'Failed to delete analysis');
    }
  };

  const confirmDeleteAnalysis = (analysisId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => handleDeleteAnalysis(analysisId) 
        }
      ]
    );
  };

  const swipeableRefs = React.useRef<{ [key: string]: Swipeable | null }>({});

  const closeAllSwiped = (currentId?: string) => {
    Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
      if (currentId !== id && ref) {
        ref.close();
      }
    });
  };

  const renderRightActions = (analysisId: string, dragX: any) => {
    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            confirmDeleteAnalysis(analysisId);
            // Close swipeable after action is taken
            if (swipeableRefs.current[analysisId]) {
              swipeableRefs.current[analysisId]?.close();
            }
          }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: BiologicalAnalysis }) => {
    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(item.id, dragX)}
        onSwipeableOpen={() => {
          closeAllSwiped(item.id);
        }}
        ref={(ref) => {
          if (ref) swipeableRefs.current[item.id] = ref;
        }}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        <AnalysisCard 
          analysis={item} 
          onPress={() => {
            // Close swipeable when card is pressed
            if (swipeableRefs.current[item.id]) {
              swipeableRefs.current[item.id]?.close();
            }
            handleAnalysisPress(item);
          }}
        />
      </Swipeable>
    );
  };

  if (loading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c7be5" />
      </View>
    );
  }

  if (error && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => loadAnalyses()} />
      </View>
    );
  }

  if (analyses.length === 0 && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No analyses found</Text>
        <Text style={styles.emptySubtext}>Upload a report to get started</Text>
        <Button title="Refresh" onPress={() => loadAnalyses()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={analyses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2c7be5']}
            tintColor="#2c7be5"
            title="Pull to refresh..."
            titleColor="#95aac9"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e63757',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#12263f',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#95aac9',
    textAlign: 'center',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#e63757',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rightActionsContainer: {
    width: 80,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 