import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { GetAnalysesUseCase } from '../../application/usecases/GetAnalysesUseCase';

type ChartScreenProps = {
  getAnalysesUseCase: GetAnalysesUseCase;
};

export const ChartScreen: React.FC<ChartScreenProps> = ({ 
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
      // Sort by date, oldest first
      const sortedAnalyses = [...result].sort((a, b) => a.date.getTime() - b.date.getTime());
      setAnalyses(sortedAnalyses);
      setError(null);
    } catch (err) {
      setError('Failed to load analyses');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  if (analyses.length < 2) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Insufficient Data</Text>
        <Text style={styles.emptySubtext}>Upload at least 2 reports to see a chart</Text>
      </View>
    );
  }

  const chartData = {
    labels: analyses.map(a => {
      const date = new Date(a.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: analyses.map(a => a.crpValue),
        color: () => '#2c7be5',
        strokeWidth: 2,
      },
    ],
    legend: ['CRP (mg/L)'],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRP Trends</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(44, 123, 229, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(18, 38, 63, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#2c7be5',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Latest</Text>
          <Text style={styles.statValue}>
            {analyses.length > 0 ? analyses[analyses.length - 1].crpValue.toFixed(1) : '-'} mg/L
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>
            {analyses.length > 0 
              ? (analyses.reduce((sum, a) => sum + a.crpValue, 0) / analyses.length).toFixed(1) 
              : '-'} mg/L
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>
            {analyses.length > 0 
              ? Math.max(...analyses.map(a => a.crpValue)).toFixed(1) 
              : '-'} mg/L
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#12263f',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#95aac9',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c7be5',
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