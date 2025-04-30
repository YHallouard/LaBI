import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { AnalyzePdfUseCase } from '../../application/usecases/AnalyzePdfUseCase';

type UploadScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'UploadPdf'>;
  analyzePdfUseCase: AnalyzePdfUseCase;
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ 
  navigation, 
  analyzePdfUseCase 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }
      
      const pdfUri = result.assets[0].uri;
      await processPdf(pdfUri);
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };
  
  const processPdf = async (pdfUri: string): Promise<void> => {
    try {
      setLoading(true);
      await analyzePdfUseCase.execute(pdfUri);
      Alert.alert(
        'Success', 
        'Analysis extracted and saved successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (err) {
      console.error('Error processing PDF:', err);
      Alert.alert('Error', 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2c7be5" />
        <Text style={styles.loadingText}>Processing document...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Medical Lab Report</Text>
      <Text style={styles.description}>
        Upload a PDF of your lab report and we'll extract the CRP value automatically.
      </Text>
      
      <TouchableOpacity 
        style={styles.uploadButton} 
        onPress={pickDocument}
      >
        <Text style={styles.uploadButtonText}>Select PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#12263f',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#95aac9',
    textAlign: 'center',
    marginBottom: 40,
  },
  uploadButton: {
    backgroundColor: '#2c7be5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#12263f',
  },
}); 