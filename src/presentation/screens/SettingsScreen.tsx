import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Keyboard, TouchableOpacity } from 'react-native';
// Remove direct Keychain import if no longer needed elsewhere in this file
// import * as Keychain from 'react-native-keychain'; 
import { SaveApiKeyUseCase } from '../../application/usecases/SaveApiKeyUseCase';
import { LoadApiKeyUseCase } from '../../application/usecases/LoadApiKeyUseCase';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ScreenLayout';

// Define Props for the screen, including the use cases
type SettingsScreenProps = {
  saveApiKeyUseCase: SaveApiKeyUseCase;
  loadApiKeyUseCase: LoadApiKeyUseCase;
};

type SettingsTab = 'api' | 'database';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  saveApiKeyUseCase, 
  loadApiKeyUseCase 
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [savedApiKey, setSavedApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    setIsLoading(true);
    setIsEditing(false);
    try {
      const loadedKey = await loadApiKeyUseCase.execute();
      if (loadedKey) {
        setApiKeyInput(loadedKey);
        setSavedApiKey(loadedKey);
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load API key.');
      setIsEditing(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateApiKey()) {
      return;
    }
    
    Keyboard.dismiss();
    setIsSaving(true);
    
    try {
      const success = await saveApiKeyUseCase.execute(apiKeyInput);
      if (success) {
        handleSuccessfulKeySave();
      } else {
        Alert.alert('Error', 'Could not save API key.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not save API key.'); 
    } finally {
      setIsSaving(false);
    }
  };
  
  const validateApiKey = (): boolean => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'API Key cannot be empty.');
      return false;
    }
    return true;
  };
  
  const handleSuccessfulKeySave = () => {
    setSavedApiKey(apiKeyInput);
    setIsEditing(false);
    setSuccessMessage('API Key saved securely.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEdit = () => {
    setApiKeyInput(savedApiKey);
    setIsEditing(true);
  };

  const maskApiKey = (key: string): string => {
    if (!key) return '';
    return key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '********';
  };

  const resetDatabase = async () => {
    setIsResetting(true);
    try {
      const result = await attemptDatabaseReset();
      displayDatabaseResetResult(result);
    } catch (error) {
      console.error('Error resetting database:', error);
      Alert.alert('Error', 'Failed to reset database: ' + error);
    } finally {
      setIsResetting(false);
    }
  };
  
  const attemptDatabaseReset = async (): Promise<'reset' | 'no_file' | 'no_dir'> => {
    const dbName = 'biological_analyses.db';
    const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
    const dbPath = `${dbDirectory}/${dbName}`;
    
    console.log('Checking if database exists at path:', dbPath);
    
    const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
    if (!dirInfo.exists) {
      return 'no_dir';
    }
    
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      return 'no_file';
    }
    
    console.log('Database file exists, deleting it...');
    await FileSystem.deleteAsync(dbPath);
    console.log('Database file deleted successfully!');
    return 'reset';
  };
  
  const displayDatabaseResetResult = (result: 'reset' | 'no_file' | 'no_dir') => {
    if (result === 'reset') {
      setSuccessMessage('Database reset completed. Please restart the app.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else if (result === 'no_file') {
      setInfoMessage('Database file does not exist.');
      setTimeout(() => setInfoMessage(null), 3000);
    } else {
      setInfoMessage('SQLite directory does not exist. No database to reset.');
      setTimeout(() => setInfoMessage(null), 3000);
    }
  };

  const confirmDatabaseReset = () => {
    Alert.alert(
      'Confirm Reset',
      'This will delete all your analyses. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetDatabase }
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2c7be5" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'api' && styles.activeTab]}
            onPress={() => setActiveTab('api')}
          >
            <Ionicons name="key-outline" size={20} color={activeTab === 'api' ? "#2c7be5" : "#95aac9"} />
            <Text style={[styles.tabText, activeTab === 'api' && styles.activeTabText]}>
              OCR Service
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'database' && styles.activeTab]}
            onPress={() => setActiveTab('database')}
          >
            <Ionicons name="refresh-outline" size={20} color={activeTab === 'database' ? "#2c7be5" : "#95aac9"} />
            <Text style={[styles.tabText, activeTab === 'database' && styles.activeTabText]}>
              Database
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content Area */}
        <View style={styles.contentContainer}>
          {successMessage && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#00d97e" style={styles.messageIcon} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}
          
          {infoMessage && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={24} color="#2c7be5" style={styles.messageIcon} />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}
          
          {activeTab === 'api' ? (
            // API Key Settings
            <View>
              <Text style={styles.sectionTitle}>API Key Settings</Text>
              <Text style={styles.description}>
                {isEditing 
                  ? "Enter your Mistral API key. It will be stored securely."
                  : "Your API key is stored securely."}
              </Text>
              
              {isEditing ? (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Mistral API Key"
                    value={apiKeyInput}
                    onChangeText={setApiKeyInput}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <View style={styles.buttonContainer}>
                    <Button 
                      title={isSaving ? "Saving..." : "Save API Key"} 
                      onPress={handleSave} 
                      disabled={isSaving}
                    />
                    {savedApiKey && (
                      <Button 
                        title="Cancel" 
                        onPress={() => setIsEditing(false)} 
                        color="gray"
                      />
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.savedKeyContainer}>
                  <Text style={styles.savedKeyText}>{maskApiKey(savedApiKey)}</Text>
                  <Button title="Edit" onPress={handleEdit} />
                </View>
              )}
            </View>
          ) : (
            // Database Reset Settings
            <View>
              <Text style={styles.sectionTitle}>Database Management</Text>
              <Text style={styles.description}>
                Reset the database to remove all analyses. This action cannot be undone.
              </Text>
              
              <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={24} color="#e63757" style={styles.warningIcon} />
                <Text style={styles.warningText}>
                  Resetting the database will permanently delete all your analyses and reports.
                </Text>
              </View>
              
              <Button 
                title={isResetting ? "Resetting..." : "Reset Database"} 
                onPress={confirmDatabaseReset} 
                color="#e63757"
                disabled={isResetting}
              />
            </View>
          )}
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#12263f',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2c7be5',
  },
  tabText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#95aac9',
  },
  activeTabText: {
    color: '#2c7be5',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#12263f',
  },
  description: {
    fontSize: 14,
    color: '#5a7184',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dfe5ef',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  savedKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dfe5ef',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  savedKeyText: {
    fontSize: 16,
    color: '#12263f',
    flex: 1,
    marginRight: 10,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(230, 55, 87, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    color: '#e63757',
    flex: 1,
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 126, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#00d97e',
    flex: 1,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(44, 123, 229, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#2c7be5',
    flex: 1,
    fontSize: 14,
  },
  messageIcon: {
    marginRight: 10,
  },
});
