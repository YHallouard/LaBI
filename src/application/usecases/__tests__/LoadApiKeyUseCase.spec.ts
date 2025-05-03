import { LoadApiKeyUseCase } from "../LoadApiKeyUseCase";
import { InMemorySecureStore } from "../../../adapters/repositories/InMemorySecureStore";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) =>
    InMemorySecureStore.getItemAsync(key)
  ),
}));

let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe("LoadApiKeyUseCase", () => {
  let useCase: LoadApiKeyUseCase;
  const API_KEY_SECURE_STORE_KEY = "mistralApiKey";

  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();

    // Create the use case
    useCase = new LoadApiKeyUseCase();

    // Setup console spies
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
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
      await InMemorySecureStore.setItemAsync(
        API_KEY_SECURE_STORE_KEY,
        testApiKey
      );

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBe(testApiKey);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "API Key loaded successfully from SecureStore."
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should return null and log message when no API key is found", async () => {
      // Given - no key in store

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No API Key found in SecureStore for key:",
        API_KEY_SECURE_STORE_KEY
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should return null and log error when secure store access fails", async () => {
      // Given
      const testError = new Error("SecureStore error");
      const originalMethod = InMemorySecureStore.getItemAsync;
      InMemorySecureStore.getItemAsync = jest.fn().mockRejectedValue(testError);

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SecureStore couldn't be accessed during load!",
        testError
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Restore original method
      InMemorySecureStore.getItemAsync = originalMethod;
    });

    it("should handle empty string API key as valid key", async () => {
      // Given
      const emptyApiKey = "";
      await InMemorySecureStore.setItemAsync(
        API_KEY_SECURE_STORE_KEY,
        emptyApiKey
      );

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBe(emptyApiKey);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "API Key loaded successfully from SecureStore."
      );
    });

    it("should correctly use the API_KEY_SECURE_STORE_KEY constant", async () => {
      // Given
      const testApiKey = "test-api-key";
      const getItemAsyncSpy = jest.spyOn(InMemorySecureStore, "getItemAsync");
      await InMemorySecureStore.setItemAsync(
        API_KEY_SECURE_STORE_KEY,
        testApiKey
      );

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toBe(testApiKey);
      expect(getItemAsyncSpy).toHaveBeenCalledWith(API_KEY_SECURE_STORE_KEY);
      getItemAsyncSpy.mockRestore();
    });
  });
});
