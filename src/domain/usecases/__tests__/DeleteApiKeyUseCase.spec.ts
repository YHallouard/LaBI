import { DeleteApiKeyUseCase } from "../DeleteApiKeyUseCase";
import { InMemorySecureStore } from "../../../adapters/repositories/InMemorySecureStore";
import { API_KEY_SECURE_STORE_KEY } from "../../../config/constants";
import * as SecureStore from "expo-secure-store";

// Mock the entire expo-secure-store module
jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Spy on console methods
let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe("DeleteApiKeyUseCase", () => {
  let useCase: DeleteApiKeyUseCase;

  beforeEach(async () => {
    // Clear the secure store before each test
    await InMemorySecureStore.clear();

    // Clear all mocks first
    jest.clearAllMocks();

    // Setup console spies BEFORE creating use case
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Create the use case
    useCase = new DeleteApiKeyUseCase();

    // Configure the mock to resolve successfully
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("execute", () => {
    it("should delete API key from secure store and return true when successful", async () => {
      // Execute the deletion
      const result = await useCase.execute();

      // Verify return value
      expect(result).toBe(true);

      // Verify deleteItemAsync was called
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        API_KEY_SECURE_STORE_KEY
      );
    });

    it("should handle non-existent key deletion gracefully", async () => {
      // Execute the deletion on a non-existent key
      const result = await useCase.execute();

      // Should still return true as the operation technically succeeded
      expect(result).toBe(true);

      // Verify deleteItemAsync was called
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        API_KEY_SECURE_STORE_KEY
      );
    });

    it("should return false when secure store deletion fails", async () => {
      // Mock secure store to throw an error
      const expectedError = new Error("SecureStore error");
      mockSecureStore.deleteItemAsync.mockRejectedValue(expectedError);

      // Execute
      const result = await useCase.execute();

      // Verify
      expect(result).toBe(false);
    });

    it("should call SecureStore.deleteItemAsync with the correct key", async () => {
      // Execute
      await useCase.execute();

      // Verify
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        API_KEY_SECURE_STORE_KEY
      );
    });
  });
});
