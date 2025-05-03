import { DeleteApiKeyUseCase } from '../DeleteApiKeyUseCase';
import { InMemorySecureStore } from '../../../adapters/repositories/InMemorySecureStore';
import { API_KEY_SECURE_STORE_KEY } from '../../../config/constants';

// Mock expo-secure-store to use our InMemorySecureStore
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(async (key: string) => InMemorySecureStore.deleteItemAsync(key))
}));

// Mock console.log and console.error to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('DeleteApiKeyUseCase', () => {
  let useCase: DeleteApiKeyUseCase;
  
  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();
    
    // Create the use case
    useCase = new DeleteApiKeyUseCase();
  });
  
  afterEach(() => {
    // Restore console mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete API key from secure store and return true when successful', async () => {
      // Set up test data in secure store
      await InMemorySecureStore.setItemAsync(API_KEY_SECURE_STORE_KEY, 'test-api-key');
      
      // Verify the key exists before deletion
      const keyBeforeDeletion = await InMemorySecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      expect(keyBeforeDeletion).toBe('test-api-key');
      
      // Execute the deletion
      const result = await useCase.execute();
      
      // Verify return value
      expect(result).toBe(true);
      
      // Verify the key was deleted
      const keyAfterDeletion = await InMemorySecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      expect(keyAfterDeletion).toBeNull();
      
      // Verify log was called
      expect(console.log).toHaveBeenCalledWith('API Key deleted successfully from SecureStore.');
    });
    
    it('should handle non-existent key deletion gracefully', async () => {
      // Verify key doesn't exist
      const keyBeforeDeletion = await InMemorySecureStore.getItemAsync(API_KEY_SECURE_STORE_KEY);
      expect(keyBeforeDeletion).toBeNull();
      
      // Execute the deletion on a non-existent key
      const result = await useCase.execute();
      
      // Should still return true as the operation technically succeeded
      expect(result).toBe(true);
      
      // Verify log was called
      expect(console.log).toHaveBeenCalledWith('API Key deleted successfully from SecureStore.');
    });
    
    it('should return false when secure store deletion fails', async () => {
      // Mock secure store to throw an error
      const originalMethod = InMemorySecureStore.deleteItemAsync;
      InMemorySecureStore.deleteItemAsync = jest.fn().mockRejectedValue(new Error('SecureStore error'));
      
      // Execute
      const result = await useCase.execute();
      
      // Verify
      expect(result).toBe(false);
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('Failed to delete API key:', expect.any(Error));
      
      // Restore original method
      InMemorySecureStore.deleteItemAsync = originalMethod;
    });
    
    it('should call SecureStore.deleteItemAsync with the correct key', async () => {
      // Set up spy
      const spy = jest.spyOn(InMemorySecureStore, 'deleteItemAsync');
      
      // Execute
      await useCase.execute();
      
      // Verify
      expect(spy).toHaveBeenCalledWith(API_KEY_SECURE_STORE_KEY);
      
      // Cleanup
      spy.mockRestore();
    });
  });
}); 