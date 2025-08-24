import { SaveApiKeyUseCase } from "../SaveApiKeyUseCase";
import { InMemorySecureStore } from "../../../adapters/repositories/InMemorySecureStore";
import { API_KEY_SECURE_STORE_KEY } from "../../../config/constants";
import * as SecureStore from "expo-secure-store";

// Mock the entire expo-secure-store module
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Spy on console methods
let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe("SaveApiKeyUseCase", () => {
  let useCase: SaveApiKeyUseCase;

  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();

    // Clear all mocks first
    jest.clearAllMocks();

    // Setup console spies BEFORE creating use case
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Create the use case
    useCase = new SaveApiKeyUseCase();

    // Configure the mock to resolve successfully
    mockSecureStore.setItemAsync.mockResolvedValue();
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

      // Check that setItemAsync was called with correct parameters
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        API_KEY_SECURE_STORE_KEY,
        testApiKey
      );

      // Test passes if no error is thrown and result is true
    });

    it("should throw error with specific message when API key is empty", async () => {
      // Given
      const emptyApiKey = "";

      // Reset mocks for this specific test
      mockSecureStore.setItemAsync.mockClear();

      // When/Then
      const error = new Error("API Key cannot be empty.");
      await expect(useCase.execute(emptyApiKey)).rejects.toThrow(error);

      // Check that setItemAsync was not called
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it("should throw error with specific message when API key is whitespace", async () => {
      // Given
      const whitespaceApiKey = "   ";

      // Reset mocks for this specific test
      mockSecureStore.setItemAsync.mockClear();

      // When/Then
      const error = new Error("API Key cannot be empty.");
      await expect(useCase.execute(whitespaceApiKey)).rejects.toThrow(error);

      // Check that setItemAsync was not called
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it("should throw error with specific message when secure store save fails", async () => {
      // Given
      const testApiKey = "test-api-key";
      const expectedError = new Error("SecureStore error");
      mockSecureStore.setItemAsync.mockRejectedValue(expectedError);

      // When/Then
      const error = new Error("Could not save API key securely.");
      await expect(useCase.execute(testApiKey)).rejects.toThrow(error);

      // Test passes if correct error is thrown
    });

    it("should validate API key is not just spaces", async () => {
      // Given
      const whitespaceApiKey = "  \t\n  ";

      // When/Then
      await expect(useCase.execute(whitespaceApiKey)).rejects.toThrow(
        "API Key cannot be empty."
      );

      // Test passes if correct error is thrown
    });

    it("should handle API keys with leading and trailing spaces", async () => {
      // Given
      const apiKeyWithSpaces = "  valid-api-key  ";

      // When
      const result = await useCase.execute(apiKeyWithSpaces);

      // Then
      expect(result).toBe(true);

      // Check that setItemAsync was called with spaces intact
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        API_KEY_SECURE_STORE_KEY,
        apiKeyWithSpaces
      );
    });
  });
});
