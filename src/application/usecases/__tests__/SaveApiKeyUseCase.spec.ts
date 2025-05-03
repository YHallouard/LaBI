import { SaveApiKeyUseCase } from "../SaveApiKeyUseCase";
import { InMemorySecureStore } from "../../../adapters/repositories/InMemorySecureStore";
import { API_KEY_SECURE_STORE_KEY } from "../../../config/constants";

// Mock expo-secure-store to use our InMemorySecureStore
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(async (key: string, value: string) =>
    InMemorySecureStore.setItemAsync(key, value)
  ),
}));

// Spy on console methods
let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe("SaveApiKeyUseCase", () => {
  let useCase: SaveApiKeyUseCase;

  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();

    // Create the use case
    useCase = new SaveApiKeyUseCase();

    // Setup console spies
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Clear mock call history
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("execute", () => {
    it("should save API key to secure store and return true", async () => {
      // Given
      const testApiKey = "test-api-key";

      // When
      const result = await useCase.execute(testApiKey);

      // Then
      expect(result).toBe(true);

      // Check that the key was stored with correct key from constants
      const storedKey = await InMemorySecureStore.getItemAsync(
        API_KEY_SECURE_STORE_KEY
      );
      expect(storedKey).toBe(testApiKey);

      // Verify console log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "API Key saved successfully to SecureStore."
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should throw error with specific message when API key is empty", async () => {
      // Given
      const emptyApiKey = "";

      // When/Then
      const error = new Error("API Key cannot be empty.");
      await expect(useCase.execute(emptyApiKey)).rejects.toThrow(error);

      // Check that nothing was stored
      const storedKey = await InMemorySecureStore.getItemAsync(
        API_KEY_SECURE_STORE_KEY
      );
      expect(storedKey).toBeNull();

      // Verify console error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SaveApiKeyUseCase: API Key cannot be empty."
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should throw error with specific message when API key is whitespace", async () => {
      // Given
      const whitespaceApiKey = "   ";

      // When/Then
      const error = new Error("API Key cannot be empty.");
      await expect(useCase.execute(whitespaceApiKey)).rejects.toThrow(error);

      // Check that nothing was stored
      const storedKey = await InMemorySecureStore.getItemAsync(
        API_KEY_SECURE_STORE_KEY
      );
      expect(storedKey).toBeNull();

      // Verify console error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SaveApiKeyUseCase: API Key cannot be empty."
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should throw error with specific message when secure store save fails", async () => {
      // Given
      const testApiKey = "test-api-key";
      const expectedError = new Error("SecureStore error");
      const originalMethod = InMemorySecureStore.setItemAsync;
      InMemorySecureStore.setItemAsync = jest
        .fn()
        .mockRejectedValue(expectedError);

      // When/Then
      const error = new Error("Could not save API key securely.");
      await expect(useCase.execute(testApiKey)).rejects.toThrow(error);

      // Verify console error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SecureStore couldn't be accessed during save!",
        expectedError
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Restore original method
      InMemorySecureStore.setItemAsync = originalMethod;
    });

    it("should validate API key is not just spaces", async () => {
      // Given
      const whitespaceApiKey = "  \t\n  ";

      // When/Then
      await expect(useCase.execute(whitespaceApiKey)).rejects.toThrow(
        "API Key cannot be empty."
      );

      // Verify error message is correct
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SaveApiKeyUseCase: API Key cannot be empty."
      );
    });

    it("should handle API keys with leading and trailing spaces", async () => {
      // Given
      const apiKeyWithSpaces = "  valid-api-key  ";

      // When
      const result = await useCase.execute(apiKeyWithSpaces);

      // Then
      expect(result).toBe(true);

      // Check that the key was stored with spaces intact
      const storedKey = await InMemorySecureStore.getItemAsync(
        API_KEY_SECURE_STORE_KEY
      );
      expect(storedKey).toBe(apiKeyWithSpaces);
    });
  });
});
