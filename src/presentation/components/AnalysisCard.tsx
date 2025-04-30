import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';

type AnalysisCardProps = {
  analysis: BiologicalAnalysis;
  onPress?: (analysis: BiologicalAnalysis) => void;
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(analysis);
    }
  };

  // Format date as DD/MM/YYYY
  const formattedDate = analysis.date.toLocaleDateString('fr-FR');

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.label}>CRP</Text>
          <Text style={styles.value}>{analysis.crpValue.toFixed(2)} mg/L</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c7be5',
  },
});
