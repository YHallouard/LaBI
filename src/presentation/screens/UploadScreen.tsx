import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { UploadStackParamList } from '../../types/navigation';
import { AnalyzePdfUseCase } from '../../application/usecases/AnalyzePdfUseCase';
import { ScreenLayout } from '../components/ScreenLayout';

type UploadScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, 'UploadScreen'>;
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pickAndProcessDocument = async (): Promise<void> => {
    if (isAnalyzing) return;

    if (!analyzePdfUseCase) {
      setErrorMessage(apiKeyError || 'API Key is not configured. Please set it in Settings.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    
    try {
      const pdfUri = await selectPdfDocument();
      if (!pdfUri) {
        setIsAnalyzing(false);
        return;
      }
      
      await analyzePdfDocument(pdfUri, analyzePdfUseCase);
      displaySuccessMessage();
    } catch (err) {
      handleDocumentProcessingError(err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const selectPdfDocument = async (): Promise<string | null> => {
    console.log('Opening document picker...');
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('Document picking cancelled or no assets found.');
      return null;
    }
    
    const pdfUri = result.assets[0].uri;
    console.log(`Document selected: ${result.assets[0].name}, URI: ${pdfUri}`);
    return pdfUri;
  };
  
  const analyzePdfDocument = async (pdfUri: string, useCase: AnalyzePdfUseCase): Promise<void> => {
    console.log(`Analyzing document: ${pdfUri}`);
    await useCase.execute(pdfUri);
    console.log('Analysis complete.');
  };
  
  const displaySuccessMessage = (): void => {
    setSuccessMessage('Analysis extracted and saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleDocumentProcessingError = (err: any): void => {
    console.error('Error during pick/process document:', err);
    Alert.alert('Error', 'Failed to process PDF. Please check the logs.');
  };
  
  if (isLoadingApiKey) {
    return <LoadingView />;
  }
  
  return (
    <ScreenLayout>
      <View style={styles.contentWrapper}>
        <Text style={styles.description}>
          Select a PDF of your lab report to automatically extract and save the data.
        </Text>
        
        {successMessage && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
        
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        
        {apiKeyError && !analyzePdfUseCase && !errorMessage && (
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

        <Text style={styles.infoText}>
          {isAnalyzing 
            ? 'Processing your document... please wait.' 
            : 'Tap the button above to select and process your PDF report.'}
        </Text>
      </View>
    </ScreenLayout>
  );
};

const LoadingView = () => (
  <ScreenLayout>
    <View style={styles.containerCentered}>
      <ActivityIndicator size="large" color="#2c7be5" />
      <Text style={styles.loadingText}>Loading configuration...</Text>
    </View>
  </ScreenLayout>
);

const styles = StyleSheet.create({
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
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
  errorContainer: {
    backgroundColor: 'rgba(230, 55, 87, 0.1)',
    borderColor: '#e63757',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#e63757',
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
  successContainer: {
    backgroundColor: 'rgba(0, 217, 126, 0.1)',
    borderColor: '#00d97e',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    color: '#00a86b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
});
