import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { GetAnalysesUseCase } from '../../application/usecases/GetAnalysesUseCase';
import { AnalysisCard } from '../components/AnalysisCard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
  getAnalysesUseCase: GetAnalysesUseCase;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  navigation, 
  getAnalysesUseCase 
}) => {
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await getAnalysesUseCase.execute();
      setAnalyses(result);
      setError(null);
    } catch (err) {
      setError('Failed to load analyses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisPress = (analysis: BiologicalAnalysis): void => {
    navigation.navigate('AnalysisDetails', { analysisId: analysis.id });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c7be5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (analyses.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No analyses found</Text>
        <Text style={styles.emptySubtext}>Upload a report to get started</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={analyses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AnalysisCard 
            analysis={item} 
            onPress={handleAnalysisPress}
          />
        )}
        refreshing={loading}
        onRefresh={loadAnalyses}
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
}); 