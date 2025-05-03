import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { UploadStackParamList } from '../../types/navigation';
import { AnalyzePdfUseCase } from '../../application/usecases/AnalyzePdfUseCase';
import { ScreenLayout } from '../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';

type UploadScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, 'UploadScreen'>;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  isLoadingApiKey: boolean;
  apiKeyError: string | null;
  checkAndLoadApiKey: () => Promise<void>;
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ 
  navigation, 
  analyzePdfUseCase,
  isLoadingApiKey,
  apiKeyError,
  checkAndLoadApiKey
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasCheckedApiKey = useRef<boolean>(false);
  
  useEffect(() => {
    if (!isLoadingApiKey && !hasCheckedApiKey.current && !analyzePdfUseCase) {
      hasCheckedApiKey.current = true;
      checkAndLoadApiKey();
    }
  }, [isLoadingApiKey, analyzePdfUseCase]);

  const hasValidApiKey = (): boolean => {
    return !apiKeyError && Boolean(analyzePdfUseCase);
  };

  const pickAndProcessDocument = async (): Promise<void> => {
    if (isAnalyzing) return;

    if (!hasValidApiKey()) {
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
      
      if (analyzePdfUseCase) {
        await analyzePdfDocument(pdfUri, analyzePdfUseCase);
        displaySuccessMessage();
      }
    } catch (err) {
      handleDocumentProcessingError(err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const selectPdfDocument = async (): Promise<string | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    
    return result.assets[0].uri;
  };
  
  const analyzePdfDocument = async (pdfUri: string, useCase: AnalyzePdfUseCase): Promise<void> => {
    await useCase.execute(pdfUri);
  };
  
  const displaySuccessMessage = (): void => {
    setSuccessMessage('Analysis extracted and saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleDocumentProcessingError = (err: any): void => {
    Alert.alert('Error', 'Failed to process PDF. Please check the logs.');
  };

  const navigateToSettings = (): void => {
    (navigation as any).navigate('Home', { screen: 'SettingsScreen' });
  };
  
  if (isLoadingApiKey) {
    return <LoadingView />;
  }
  
  return (
    <ScreenLayout scrollable={false}>
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
        
        {!hasValidApiKey() && !errorMessage && (
          <ApiKeyMissingMessage 
            apiKeyError={apiKeyError} 
            onNavigateToSettings={navigateToSettings} 
          />
        )}

        <TouchableOpacity 
          style={[styles.uploadButton, (!hasValidApiKey() || isAnalyzing) && styles.disabledButton]} 
          onPress={pickAndProcessDocument}
          disabled={!hasValidApiKey() || isAnalyzing}
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

type ApiKeyMissingMessageProps = {
  apiKeyError: string | null;
  onNavigateToSettings: () => void;
};

const ApiKeyMissingMessage: React.FC<ApiKeyMissingMessageProps> = ({ 
  apiKeyError, 
  onNavigateToSettings 
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>
      {apiKeyError || 'API Key is not configured. Please set it in Settings.'}
    </Text>
    <TouchableOpacity 
      style={styles.settingsButton} 
      onPress={onNavigateToSettings}
    >
      <Ionicons name="settings-outline" size={16} color="#ffffff" style={styles.settingsIcon} />
      <Text style={styles.settingsButtonText}>Go to Settings</Text>
    </TouchableOpacity>
  </View>
);

const LoadingView = () => (
  <ScreenLayout scrollable={false}>
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
  settingsButton: {
    backgroundColor: '#2c7be5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsIcon: {
    marginRight: 8,
  },
});
