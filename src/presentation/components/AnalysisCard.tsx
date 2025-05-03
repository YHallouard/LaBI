import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BiologicalAnalysis, LabValue } from '../../domain/entities/BiologicalAnalysis';

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

  const formattedDate = formatAnalysisDate(analysis.date);
  const crpData = extractCRPData(analysis);

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
          <Text style={styles.value}>{formatLabValue(crpData)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const formatAnalysisDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR');
};

type CRPData = {
  value: number | string;
  unit: string;
  isActive: boolean;
};

const extractCRPData = (analysis: BiologicalAnalysis): CRPData => {
  const crpData = analysis["Proteine C Reactive"];
  const isActive = Boolean(crpData && typeof crpData === 'object' && 'value' in crpData);
  
  if (isActive && crpData && typeof crpData === 'object' && 'value' in crpData) {
    const labValue = crpData as LabValue;
    return {
      value: labValue.value,
      unit: labValue.unit || "mg/L",
      isActive: true
    };
  }
  
  return {
    value: "-.--",
    unit: "mg/L",
    isActive: false
  };
};

const formatLabValue = (data: CRPData): string => {
  if (!data.isActive || typeof data.value === 'string') {
    return `${data.value} ${data.unit}`;
  }
  return `${data.value.toFixed(2)} ${data.unit}`;
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
