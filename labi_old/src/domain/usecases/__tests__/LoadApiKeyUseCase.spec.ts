import { LoadApiKeyUseCase } from "../LoadApiKeyUseCase";
import { InMemorySecureStore } from "../../../adapters/repositories/InMemorySecureStore";
import * as SecureStore from "expo-secure-store";

// Mock the entire expo-secure-store module
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe("LoadApiKeyUseCase", () => {
  let useCase: LoadApiKeyUseCase;
  const API_KEY_SECURE_STORE_KEY = "mistralApiKey";

  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();

    // Clear all mocks first
    jest.clearAllMocks();

    // Setup console spies BEFORE creating use case
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Create the use case
    useCase = new LoadApiKeyUseCase();

    // Configure the mock to return null by default
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("execute", () => {
    it("should load API key from secure store and log success message", async () => {
      // Given
      const testApiKey = "test-api-key";
      mockSecureStore.getItemAsync.mockResolvedValue(testApiKey);

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBe(testApiKey);
    });

    it("should return null and log message when no API key is found", async () => {
      // Given - no key in store

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBeNull();
    });

    it("should return null and log error when secure store access fails", async () => {
      // Given
      const testError = new Error("SecureStore error");
      mockSecureStore.getItemAsync.mockRejectedValue(testError);

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBeNull();
    });

    it("should handle empty string API key as valid key", async () => {
      // Given
      const emptyApiKey = "";
      mockSecureStore.getItemAsync.mockResolvedValue(emptyApiKey);

      // When
      const result = await useCase.execute();

      // Then
      // Empty string is treated as a valid key by SecureStore
      expect(result).toBe(emptyApiKey);
    });

    it("should correctly use the API_KEY_SECURE_STORE_KEY constant", async () => {
      // Given
      const testApiKey = "test-api-key";
      mockSecureStore.getItemAsync.mockResolvedValue(testApiKey);

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBe(testApiKey);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        API_KEY_SECURE_STORE_KEY
      );
    });
  });
});
