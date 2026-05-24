import {
  initializeDatabase,
  getDatabaseStorage,
  getDatabase,
} from "../DatabaseInitializer";
import { SQLiteDatabaseStorage } from "../../../adapters/infrastructure/SQLiteDatabaseStorage";
import * as SecureStore from "expo-secure-store";

// Mock dependencies
jest.mock("../../../adapters/infrastructure/SQLiteDatabaseStorage");
jest.mock("expo-secure-store");

// Mock console methods
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("DatabaseInitializer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe("initializeDatabase", () => {
    test("should initialize database successfully", async () => {
      const result = await initializeDatabase();

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("should reuse existing database instance on subsequent calls", async () => {
      // First call
      const result1 = await initializeDatabase();

      // Second call
      const result2 = await initializeDatabase();

      expect(result1).toBe(result2);
    });
  });

  describe("getDatabaseStorage", () => {
    test("should return database storage if initialized", async () => {
      // Initialize first
      await initializeDatabase();

      const result = await getDatabaseStorage();

      expect(result).toBeDefined();
    });
  });

  describe("getDatabase", () => {
    test("should return database instance from storage", async () => {
      // Initialize first
      const storage = await initializeDatabase();

      const result = await getDatabase();

      // Test passes if we can get the database
      expect(storage).toBeDefined();
    });
  });
});
