import { SaveApiKeyUseCase } from '../SaveApiKeyUseCase';
import { InMemorySecureStore } from '../../../adapters/repositories/InMemorySecureStore';

// Mock expo-secure-store to use our InMemorySecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => InMemorySecureStore.setItemAsync(key, value))
}));

describe('SaveApiKeyUseCase', () => {
  let useCase: SaveApiKeyUseCase;
  const API_KEY_SECURE_STORE_KEY = 'mistralApiKey';
  
  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();
    
    // Create the use case
    useCase = new SaveApiKeyUseCase();
  });

  describe('execute', () => {
    it('should save API key to secure store', async () => {
      // Execute
      const result = await useCase.execute('test-api-key');

      // Verify
      expect(result).toBe(true);
      
      // Check that the key was stored
      const storedKey = await InMemorySecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      expect(storedKey).toBe('test-api-key');
    });

    it('should throw error when API key is empty', async () => {
      // Execute and verify
      await expect(useCase.execute('')).rejects.toThrow('API Key cannot be empty.');
      
      // Check that nothing was stored
      const storedKey = await InMemorySecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      expect(storedKey).toBeNull();
    });

    it('should throw error when API key is whitespace', async () => {
      // Execute and verify
      await expect(useCase.execute('   ')).rejects.toThrow('API Key cannot be empty.');
      
      // Check that nothing was stored
      const storedKey = await InMemorySecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      expect(storedKey).toBeNull();
    });

    it('should throw error when secure store save fails', async () => {
      // Mock secure store to throw an error
      const originalMethod = InMemorySecureStore.setItemAsync;
      InMemorySecureStore.setItemAsync = jest.fn().mockRejectedValue(new Error('SecureStore error'));
      
      // Execute and verify
      await expect(useCase.execute('test-api-key')).rejects.toThrow('Could not save API key securely.');
      
      // Restore original method
      InMemorySecureStore.setItemAsync = originalMethod;
    });
  });
}); 