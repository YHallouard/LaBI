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
import { HomeStackParamList } from '../../types/navigation';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ScreenLayout';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenProps = {
  getAnalysesUseCase: GetAnalysesUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  navigation: StackNavigationProp<HomeStackParamList, 'HomeScreen'>;
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
  
  const swipeableRefs = React.useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    loadAnalyses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAnalyses(true);
    }, [])
  );

  const loadAnalyses = async (refresh: boolean = false): Promise<void> => {
    if (!refresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const result = await fetchAnalysesFromRepository();
      const sortedAnalyses = sortAnalysesByDateDescending(result);
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
  
  const fetchAnalysesFromRepository = async (): Promise<BiologicalAnalysis[]> => {
    console.log('HomeScreen: About to execute getAnalysesUseCase.execute()');
    const result = await getAnalysesUseCase.execute();
    console.log('HomeScreen: Received results from UseCase:', result.length);
    return result;
  };
  
  const sortAnalysesByDateDescending = (analyses: BiologicalAnalysis[]): BiologicalAnalysis[] => {
    return [...analyses].sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const onRefresh = () => {
    console.log('HomeScreen: Refresh triggered');
    loadAnalyses(true);
  };

  const navigateToAnalysisDetails = (analysis: BiologicalAnalysis): void => {
    navigation.navigate('AnalysisDetails', { analysisId: analysis.id });
  };

  const deleteAnalysis = async (analysisId: string) => {
    try {
      await deleteAnalysisUseCase.execute(analysisId);
      removeAnalysisFromList(analysisId);
      closeSwipeableItem(analysisId);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      Alert.alert('Error', 'Failed to delete analysis');
    }
  };
  
  const removeAnalysisFromList = (analysisId: string): void => {
    setAnalyses(prevAnalyses => prevAnalyses.filter(analysis => analysis.id !== analysisId));
  };
  
  const closeSwipeableItem = (itemId: string): void => {
    if (swipeableRefs.current[itemId]) {
      swipeableRefs.current[itemId]?.close();
    }
  };

  const confirmDelete = (analysisId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteAnalysis(analysisId) 
        }
      ]
    );
  };

  const closeAllSwipeableItems = (currentId?: string) => {
    Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
      if (currentId !== id && ref) {
        ref.close();
      }
    });
  };

  const renderDeleteButton = (analysisId: string) => {
    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            confirmDelete(analysisId);
            closeSwipeableItem(analysisId);
          }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAnalysisItem = ({ item }: { item: BiologicalAnalysis }) => {
    return (
      <Swipeable
        renderRightActions={() => renderDeleteButton(item.id)}
        onSwipeableOpen={() => closeAllSwipeableItems(item.id)}
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
            closeSwipeableItem(item.id);
            navigateToAnalysisDetails(item);
          }}
        />
      </Swipeable>
    );
  };

  if (loading && !isRefreshing) {
    return <LoadingView />;
  }

  if (error && !isRefreshing) {
    return <ErrorView error={error} onRetry={() => loadAnalyses()} />;
  }

  if (analyses.length === 0 && !isRefreshing) {
    return <EmptyView onRefresh={() => loadAnalyses()} />;
  }

  return (
    <ScreenLayout>
      <FlatList
        data={analyses}
        keyExtractor={item => item.id}
        renderItem={renderAnalysisItem}
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
    </ScreenLayout>
  );
};

const LoadingView = () => (
  <ScreenLayout>
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2c7be5" />
    </View>
  </ScreenLayout>
);

const ErrorView = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <ScreenLayout>
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <Button title="Try Again" onPress={onRetry} />
    </View>
  </ScreenLayout>
);

const EmptyView = ({ onRefresh }: { onRefresh: () => void }) => (
  <ScreenLayout>
    <View style={styles.centered}>
      <Text style={styles.emptyText}>No analyses found</Text>
      <Text style={styles.emptySubtext}>Upload a report to get started</Text>
      <Button title="Refresh" onPress={onRefresh} />
    </View>
  </ScreenLayout>
);

const styles = StyleSheet.create({
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
