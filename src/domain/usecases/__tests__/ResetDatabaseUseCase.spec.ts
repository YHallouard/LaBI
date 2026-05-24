import { ResetDatabaseUseCase } from "../ResetDatabaseUseCase";
import { DatabaseStoragePort } from "../../../ports/infrastructure/DatabaseStoragePort";
import { ProfileService } from "../../../domain/services/ProfileService";

// Mock ProfileService singleton
jest.mock("../../services/ProfileService", () => {
  const mockProfileService = {
    checkProfileExists: jest.fn(),
    setProfileExists: jest.fn(),
    resetProfileCheck: jest.fn(),
  };

  return {
    ProfileService: {
      getInstance: jest.fn(() => mockProfileService),
      resetInstance: jest.fn(),
    },
  };
});

class MockDatabaseStorage implements DatabaseStoragePort {
  resetCalled = false;
  mockDbResult = { id: "test-db" };
  shouldThrowError = false;
  errorMessage: string | null = null;

  async databaseExists(): Promise<boolean> {
    return true;
  }

  async deleteDatabase(): Promise<void> {
    // Implementation not needed for these tests
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async initializeDatabase(): Promise<any> {
    return this.mockDbResult;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async getDatabase(): Promise<any> {
    return this.mockDbResult;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async resetDatabase(): Promise<any> {
    this.resetCalled = true;

    if (this.shouldThrowError) {
      if (this.errorMessage) {
        throw new Error(this.errorMessage);
      }
      throw new Error("Mock reset error");
    }

    return this.mockDbResult;
  }

  async exportData(): Promise<string> {
    return JSON.stringify({ data: "mock-export" });
  }

  async importData(data: string): Promise<void> {
    // Mock implementation
    console.log("Mock importing data:", data);
  }
}

describe("ResetDatabaseUseCase", () => {
  let mockStorage: MockDatabaseStorage;
  let mockProfileService: jest.Mocked<ProfileService>;
  let useCase: ResetDatabaseUseCase;
  let originalConsoleError: typeof console.error;
  let originalConsoleLog: typeof console.log;
  let originalSetTimeout: typeof setTimeout;

  beforeEach(() => {
    mockStorage = new MockDatabaseStorage();
    mockProfileService =
      ProfileService.getInstance() as jest.Mocked<ProfileService>;
    useCase = new ResetDatabaseUseCase(mockStorage, mockProfileService);

    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();

    originalSetTimeout = global.setTimeout;
    // @ts-expect-error - Ignoring type issues with setTimeout mock
    global.setTimeout = jest.fn().mockImplementation((callback) => {
      callback();
      return 1;
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    global.setTimeout = originalSetTimeout;
  });

  test("should reset database and update profile service", async () => {
    const result = await useCase.execute();

    expect(mockStorage.resetCalled).toBe(true);
    expect(result).toBe(mockStorage.mockDbResult);
    expect(mockProfileService.setProfileExists).toHaveBeenCalledWith(false);
  });

  test("should wait for changes to propagate before returning", async () => {
    await useCase.execute();

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  test("should throw general error when reset fails without specific message", async () => {
    mockStorage.shouldThrowError = true;

    await expect(useCase.execute()).rejects.toThrow("Mock reset error");
  });

  test("should throw specific error when reset fails with specific message", async () => {
    mockStorage.shouldThrowError = true;
    mockStorage.errorMessage = "Specific database error";

    await expect(useCase.execute()).rejects.toThrow("Specific database error");
  });
});
