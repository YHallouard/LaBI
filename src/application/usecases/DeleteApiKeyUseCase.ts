import * as SecureStore from 'expo-secure-store';
import { API_KEY_SECURE_STORE_KEY } from '../../config/constants';

export class DeleteApiKeyUseCase {
  async execute(): Promise<boolean> {
    try {
      await this.deleteApiKey();
      console.log('API Key deleted successfully from SecureStore.');
      return true;
    } catch (error) {
      console.error('Failed to delete API key:', error);
      return false;
    }
  }

  private async deleteApiKey(): Promise<void> {
    await SecureStore.deleteItemAsync(API_KEY_SECURE_STORE_KEY);
  }
} 