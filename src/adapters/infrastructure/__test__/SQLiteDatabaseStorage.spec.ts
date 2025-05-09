import { SQLiteDatabaseStorage, Database } from "../SQLiteDatabaseStorage";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

// Mock the FileSystem module
jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mock/path/",
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock the SQLite module
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(),
}));

describe("SQLiteDatabaseStorage", () => {
  // Setup
  let storage: SQLiteDatabaseStorage;
  const mockDbName = "test-database.db";
  const mockDbDirectory = "file:///mock/path/SQLite";
  const mockDbPath = `${mockDbDirectory}/${mockDbName}`;

  // Mock database instance with proper jest mock typing
  const mockDb = {
    execSync: jest.fn(),
    getAllSync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
  } as unknown as Database;

  beforeEach(() => {
    storage = new SQLiteDatabaseStorage(mockDbName);
    (SQLite.openDatabaseSync as jest.Mock).mockReturnValue(mockDb);

    // Setup default mock return values
    (mockDb.getAllSync as jest.Mock).mockReturnValue([
      { name: "biological_analyses" },
    ]);
    (mockDb.runAsync as jest.Mock).mockResolvedValue({ rowsAffected: 1 });

    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  describe("initializeDatabase", () => {
    test("should initialize database and create tables", async () => {
      // Given
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      // When
      const result = await storage.initializeDatabase();

      // Then
      expect(SQLite.openDatabaseSync).toHaveBeenCalledWith(mockDbName);
      expect(mockDb.execSync).toHaveBeenCalled();
      expect(mockDb.getAllSync).toHaveBeenCalled();
      expect(result).toBe(mockDb);
    });

    test("should insert test analyses data", async () => {
      // Given
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      // When
      await storage.initializeDatabase();

      // Then
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);

      // Verify first test analysis insert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO biological_analyses"),
        expect.arrayContaining([
          "1",
          expect.any(String),
          "source1.pdf",
          expect.any(String),
        ])
      );

      // Verify second test analysis insert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO biological_analyses"),
        expect.arrayContaining([
          "2",
          expect.any(String),
          "source2.pdf",
          expect.any(String),
        ])
      );
    });

    test("should throw error if table creation fails", async () => {
      // Given
      (mockDb.getAllSync as jest.Mock).mockReturnValueOnce([]);

      // When / Then
      await expect(storage.initializeDatabase()).rejects.toThrow(
        "Table was not created successfully"
      );
      expect(SQLite.openDatabaseSync).toHaveBeenCalledWith(mockDbName);
      expect(mockDb.execSync).toHaveBeenCalled();
    });

    test("should handle errors when inserting test data", async () => {
      // Given
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });
      (mockDb.runAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Insert error")
      );

      // When/Then
      await expect(storage.initializeDatabase()).rejects.toThrow(
        "Insert error"
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO biological_analyses"),
        expect.arrayContaining([
          "1",
          expect.any(String),
          "source1.pdf",
          expect.any(String),
        ])
      );
    });
  });

  describe("databaseExists", () => {
    test("should return true when both directory and database file exist", async () => {
      // Given
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((path) => {
        if (path === mockDbDirectory || path === mockDbPath) {
          return Promise.resolve({ exists: true });
        }
        return Promise.resolve({ exists: false });
      });

      // When
      const exists = await storage.databaseExists();

      // Then
      expect(exists).toBe(true);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockDbDirectory);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockDbPath);
    });

    test("should return false when directory does not exist", async () => {
      // Given
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((path) => {
        if (path === mockDbDirectory) {
          return Promise.resolve({ exists: false });
        }
        return Promise.resolve({ exists: true });
      });

      // When
      const exists = await storage.databaseExists();

      // Then
      expect(exists).toBe(false);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockDbDirectory);
      expect(FileSystem.getInfoAsync).not.toHaveBeenCalledWith(mockDbPath);
    });
  });

  describe("deleteDatabase", () => {
    test("should delete database file when it exists", async () => {
      // Given
      /* eslint-disable @typescript-eslint/no-unused-vars */
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((path) => {
        return Promise.resolve({ exists: true });
      });
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      // When
      await storage.deleteDatabase();

      // Then
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(mockDbPath);
    });
  });

  describe("resetDatabase", () => {
    test("should delete and then reinitialize the database", async () => {
      // Given
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      // Spy on the component methods
      jest.spyOn(storage, "deleteDatabase").mockResolvedValue();
      jest.spyOn(storage, "initializeDatabase").mockResolvedValue(mockDb);

      // When
      const result = await storage.resetDatabase();

      // Then
      expect(storage.deleteDatabase).toHaveBeenCalledTimes(1);
      expect(storage.initializeDatabase).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockDb);
    });
  });
});
