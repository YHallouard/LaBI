import * as SecureStore from 'expo-secure-store';

const API_KEY_SECURE_STORE_KEY = 'mistralApiKey'; // Key for SecureStore

export class SaveApiKeyUseCase {
  async execute(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      console.error('SaveApiKeyUseCase: API Key cannot be empty.');
      throw new Error('API Key cannot be empty.');
    }
    try {
      await SecureStore.setItemAsync(API_KEY_SECURE_STORE_KEY, apiKey);
      console.log('API Key saved successfully to SecureStore.');
      return true;
    } catch (error) {
      console.error("SecureStore couldn't be accessed during save!", error);
      throw new Error('Could not save API key securely.');
    }
  }
} 