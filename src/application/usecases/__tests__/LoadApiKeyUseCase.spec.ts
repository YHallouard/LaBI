import { LoadApiKeyUseCase } from '../LoadApiKeyUseCase';
import { InMemorySecureStore } from '../../../adapters/repositories/InMemorySecureStore';

// Mock expo-secure-store to use our InMemorySecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => InMemorySecureStore.getItemAsync(key))
}));

describe('LoadApiKeyUseCase', () => {
  let useCase: LoadApiKeyUseCase;
  const API_KEY_SECURE_STORE_KEY = 'mistralApiKey';
  
  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();
    
    // Create the use case
    useCase = new LoadApiKeyUseCase();
  });

  describe('execute', () => {
    it('should load API key from secure store', async () => {
      // Set up test data in secure store
      await InMemorySecureStore.setItemAsync(API_KEY_SECURE_STORE_KEY, 'test-api-key');

      // Execute
      const result = await useCase.execute();

      // Verify
      expect(result).toBe('test-api-key');
    });

    it('should return null when no API key is found', async () => {
      // Execute without setting any API key
      const result = await useCase.execute();

      // Verify
      expect(result).toBeNull();
    });

    it('should return null when secure store access fails', async () => {
      // Mock secure store to throw an error
      const originalMethod = InMemorySecureStore.getItemAsync;
      InMemorySecureStore.getItemAsync = jest.fn().mockRejectedValue(new Error('SecureStore error'));
      
      // Execute
      const result = await useCase.execute();

      // Verify
      expect(result).toBeNull();
      
      // Restore original method
      InMemorySecureStore.getItemAsync = originalMethod;
    });
  });
}); 