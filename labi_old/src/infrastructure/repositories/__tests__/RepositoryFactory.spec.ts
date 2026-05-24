import { RepositoryFactory } from "../RepositoryFactory";
import { SQLiteBiologicalAnalysisRepository } from "../../../adapters/repositories/SQLiteBiologicalAnalysisRepository";
import { SQLiteUserProfileRepository } from "../../../adapters/repositories/SQLiteUserProfileRepository";
import { getDatabaseStorage } from "../../database/DatabaseInitializer";

// Mock dependencies
jest.mock("../../../adapters/repositories/SQLiteBiologicalAnalysisRepository");
jest.mock("../../../adapters/repositories/SQLiteUserProfileRepository");
jest.mock("../../database/DatabaseInitializer", () => ({
  getDatabaseStorage: jest.fn(),
}));

// Mock console methods
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("RepositoryFactory", () => {
  let mockDatabaseStorage: any;
  let mockBiologicalAnalysisRepo: jest.Mocked<SQLiteBiologicalAnalysisRepository>;
  let mockUserProfileRepo: jest.Mocked<SQLiteUserProfileRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock database storage
    mockDatabaseStorage = {
      initializeDatabase: jest.fn(),
      getDatabase: jest.fn(),
      databaseExists: jest.fn(),
      deleteDatabase: jest.fn(),
      resetDatabase: jest.fn(),
      resetUserProfileTable: jest.fn(),
    };

    // Mock getDatabaseStorage
    (getDatabaseStorage as jest.Mock).mockResolvedValue(mockDatabaseStorage);

    // Create mock repositories
    mockBiologicalAnalysisRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reset: jest.fn(),
    } as any;

    mockUserProfileRepo = {
      retrieve: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      reset: jest.fn(),
    } as any;

    // Mock repository constructors
    (
      SQLiteBiologicalAnalysisRepository as jest.MockedClass<
        typeof SQLiteBiologicalAnalysisRepository
      >
    ).mockImplementation(() => mockBiologicalAnalysisRepo);

    (
      SQLiteUserProfileRepository as jest.MockedClass<
        typeof SQLiteUserProfileRepository
      >
    ).mockImplementation(() => mockUserProfileRepo);

    // Reset singleton instances by clearing the module cache
    jest.resetModules();

    // Clear console spies
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe("getBiologicalAnalysisRepository", () => {
    test("should create and return BiologicalAnalysisRepository instance", async () => {
      const result = await RepositoryFactory.getBiologicalAnalysisRepository();

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("should reuse existing BiologicalAnalysisRepository instance", async () => {
      // First call
      const result1 = await RepositoryFactory.getBiologicalAnalysisRepository();

      // Second call
      const result2 = await RepositoryFactory.getBiologicalAnalysisRepository();

      expect(result1).toBe(result2);
    });
  });

  describe("getUserProfileRepository", () => {
    test("should create and return UserProfileRepository instance", async () => {
      const result = await RepositoryFactory.getUserProfileRepository();

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("should reuse existing UserProfileRepository instance", async () => {
      // First call
      const result1 = await RepositoryFactory.getUserProfileRepository();

      // Second call
      const result2 = await RepositoryFactory.getUserProfileRepository();

      expect(result1).toBe(result2);
    });
  });

  describe("singleton behavior", () => {
    test("should maintain separate instances for different repository types", async () => {
      const bioRepo = await RepositoryFactory.getBiologicalAnalysisRepository();
      const userRepo = await RepositoryFactory.getUserProfileRepository();

      expect(bioRepo).not.toBe(userRepo);
      expect(bioRepo).toBeDefined();
      expect(userRepo).toBeDefined();
    });
  });
});
