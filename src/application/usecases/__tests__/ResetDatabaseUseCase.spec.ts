import { ResetDatabaseUseCase } from "../ResetDatabaseUseCase";
import { DatabaseStoragePort } from "../../../ports/infrastructure/DatabaseStoragePort";

class MockDatabaseStorage implements DatabaseStoragePort {
  databaseExists = jest.fn();
  deleteDatabase = jest.fn();
  initializeDatabase = jest.fn();
  getDatabase = jest.fn();
  resetDatabase = jest.fn();
}

describe("ResetDatabaseUseCase", () => {
  let mockStorage: MockDatabaseStorage;
  let useCase: ResetDatabaseUseCase;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    mockStorage = new MockDatabaseStorage();
    useCase = new ResetDatabaseUseCase(mockStorage);

    originalConsoleError = console.error;
    console.error = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test("should call resetDatabase on storage port", async () => {
    // Given
    const mockDbResult = { id: "test-db" };
    mockStorage.resetDatabase.mockResolvedValue(mockDbResult);

    // When
    const result = await useCase.execute();

    // Then
    expect(mockStorage.resetDatabase).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockDbResult);
  });

  test("should throw error when reset operation fails", async () => {
    // Given
    const expectedError = new Error("Database error");
    mockStorage.resetDatabase.mockRejectedValue(expectedError);

    // When / Then
    await expect(useCase.execute()).rejects.toThrow("Failed to reset database");
    expect(mockStorage.resetDatabase).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });
});
