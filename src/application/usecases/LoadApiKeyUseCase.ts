import * as SecureStore from 'expo-secure-store';

const API_KEY_SECURE_STORE_KEY = 'mistralApiKey'; // Key for SecureStore

export class LoadApiKeyUseCase {
  async execute(): Promise<string | null> {
    try {
      const apiKey = await SecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      if (apiKey) {
        console.log('API Key loaded successfully from SecureStore.');
        return apiKey;
      }
      console.log('No API Key found in SecureStore for key:', API_KEY_SECURE_STORE_KEY);
      return null;
    } catch (error) {
      console.error("SecureStore couldn't be accessed during load!", error);
      return null;
    }
  }
}
