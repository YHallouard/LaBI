import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { AnalyzePdfUseCase } from '../../application/usecases/AnalyzePdfUseCase';

type UploadScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'UploadPdf'>;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  isLoadingApiKey: boolean;
  apiKeyError: string | null;
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ 
  navigation, 
  analyzePdfUseCase,
  isLoadingApiKey,
  apiKeyError 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const pickAndProcessDocument = async (): Promise<void> => {
    if (isAnalyzing) return;

    if (!analyzePdfUseCase) {
      Alert.alert('Setup Required', apiKeyError || 'API Key is not configured. Please set it in Settings.');
      return;
    }

    setIsAnalyzing(true);
    let pdfUri: string | null = null;

    try {
      console.log('Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Document picking cancelled or no assets found.');
        setIsAnalyzing(false);
        return;
      }
      
      pdfUri = result.assets[0].uri;
      console.log(`Document selected: ${result.assets[0].name}, URI: ${pdfUri}`);

      console.log(`Analyzing document: ${pdfUri}`);
      await analyzePdfUseCase.execute(pdfUri);
      console.log('Analysis complete.');

      Alert.alert(
        'Success', 
        'Analysis extracted and saved successfully',
        [{ text: 'OK' }]
      );

    } catch (err) {
      console.error('Error during pick/process document:', err);
      if (pdfUri) {
         Alert.alert('Analysis Error', 'Failed to process PDF. Please check the logs.');
      } else {
         Alert.alert('File Error', 'Failed to select or access the document.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  if (isLoadingApiKey) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#2c7be5" />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Medical Lab Report</Text>
      <Text style={styles.description}>
        Select a PDF of your lab report to automatically extract and save the data.
      </Text>
      
      {apiKeyError && !analyzePdfUseCase && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>{apiKeyError}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.uploadButton, (isAnalyzing || !analyzePdfUseCase) && styles.disabledButton]} 
        onPress={pickAndProcessDocument}
        disabled={isAnalyzing || !analyzePdfUseCase}
      >
        {isAnalyzing ? (
           <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
        ) : (
          <Text style={styles.uploadButtonText}>Select & Analyze PDF</Text>
        )}
      </TouchableOpacity>

      {!isAnalyzing && (
         <Text style={styles.infoText}>
           Tap the button above to select and process your PDF report.
         </Text>
      )}
       {isAnalyzing && (
         <Text style={styles.infoText}>
           Processing your document... please wait.
         </Text>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f5f7fb',
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#12263f',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#5a7184',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  uploadButton: {
    backgroundColor: '#2c7be5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: '#a0c7f0',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
   buttonSpinner: {
    marginRight: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#5a7184',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginTop: 30,
    fontSize: 14,
    color: '#5a7184',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
}); 