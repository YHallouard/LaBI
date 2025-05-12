import { SQLiteDatabaseStorage, Database } from "../SQLiteDatabaseStorage";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mock/path/",
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "ios",
}));

describe("SQLiteDatabaseStorage", () => {
  let storage: SQLiteDatabaseStorage;
  const mockDbName = "test-database.db";
  const mockDbDirectory = "file:///mock/path/SQLite";
  const mockDbPath = `${mockDbDirectory}/${mockDbName}`;

  const mockDb = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn().mockResolvedValue({ value: 1 }),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  } as unknown as Database;

  beforeEach(() => {
    storage = new SQLiteDatabaseStorage(mockDbName);
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);

    (mockDb.getAllAsync as jest.Mock).mockImplementation((query) => {
      if (query.includes("COUNT(*)")) {
        return Promise.resolve([{ count: 0 }]);
      }
      if (query.includes("sqlite_master")) {
        return Promise.resolve([
          { name: "biological_analyses" },
          { name: "user_profile" },
        ]);
      }
      return Promise.resolve([]);
    });

    jest.clearAllMocks();
  });

  describe("initializeDatabase", () => {
    test("should initialize database and create tables when they don't exist", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      (mockDb.getAllAsync as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve([]);
      });

      const result = await storage.initializeDatabase();

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith(mockDbName);
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "CREATE TABLE IF NOT EXISTS biological_analyses"
        )
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS user_profile")
      );
      expect(result).toBe(mockDb);
    });

    test("should reuse existing connection if healthy", async () => {
      // Setup storage with a mock DB instance
      const result = await storage.initializeDatabase();

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith("SELECT 1");
      expect(result).toBe(mockDb);
      expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
    });

    test("should insert test analyses data when biological_analyses table is empty", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const result = await storage.initializeDatabase();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT COUNT(*) as count FROM biological_analyses"
        )
      );

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO biological_analyses")
      );

      expect(result).toBe(mockDb);
    });

    test("should not insert test data if biological_analyses table has records", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      (mockDb.getAllAsync as jest.Mock).mockImplementation((query) => {
        if (query.includes("COUNT(*)")) {
          return Promise.resolve([{ count: 2 }]);
        }
        if (query.includes("sqlite_master")) {
          return Promise.resolve([
            { name: "biological_analyses" },
            { name: "user_profile" },
          ]);
        }
        return Promise.resolve([]);
      });

      await storage.initializeDatabase();

      const insertCalls = (mockDb.execAsync as jest.Mock).mock.calls.filter(
        (call) => call[0].includes("INSERT INTO biological_analyses")
      );

      expect(insertCalls.length).toBe(0);
    });

    test("should throw error if tables verification fails", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      (mockDb.getAllAsync as jest.Mock).mockImplementation((query) => {
        if (query.includes("sqlite_master")) {
          return Promise.resolve([{ name: "biological_analyses" }]);
        }
        return Promise.resolve([]);
      });

      await expect(storage.initializeDatabase()).rejects.toThrow(
        "Not all tables were created successfully"
      );
    });

    test("should retry initialization after failure", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      (mockDb.getAllAsync as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error("Database error");
        })
        .mockImplementation((query) => {
          if (query.includes("sqlite_master")) {
            return Promise.resolve([
              { name: "biological_analyses" },
              { name: "user_profile" },
            ]);
          }
          if (query.includes("COUNT(*)")) {
            return Promise.resolve([{ count: 0 }]);
          }
          return Promise.resolve([]);
        });

      const result = await storage.initializeDatabase();

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
      expect(result).toBe(mockDb);
    });

    test("should serialize multiple initialization calls", async () => {
      // Mock implementation to simulate async operation
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      let resolveInitPromise: (value: any) => void;
      const initPromise = new Promise((resolve) => {
        resolveInitPromise = resolve;
      });

      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(storage as any, "performInitialization")
        .mockImplementationOnce(() => {
          return initPromise;
        });

      // Start two initializations
      const promise1 = storage.initializeDatabase();
      const promise2 = storage.initializeDatabase();

      // Resolve the first one
      resolveInitPromise!(mockDb);

      // Both should resolve to the same result
      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(mockDb);
      expect(result2).toBe(mockDb);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      expect((storage as any).performInitialization).toHaveBeenCalledTimes(1);
    });
  });

  describe("databaseExists", () => {
    test("should return true when both directory and database file exist", async () => {
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((path) => {
        return Promise.resolve({ exists: true });
      });

      const exists = await storage.databaseExists();

      expect(exists).toBe(true);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockDbDirectory);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockDbPath);
    });

    test("should return false when directory does not exist", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve({ exists: false });
      });

      const exists = await storage.databaseExists();

      expect(exists).toBe(false);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockDbDirectory);
      expect(FileSystem.getInfoAsync).not.toHaveBeenCalledWith(mockDbPath);
    });
  });

  describe("deleteDatabase", () => {
    test("should delete database file when it exists", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ exists: true });
      });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        `${mockDbName}`,
        `${mockDbName}-journal`,
      ]);

      await storage.deleteDatabase();

      expect(mockDb.closeAsync).toHaveBeenCalled();
      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledWith(
        mockDbDirectory
      );
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining(mockDbName),
        expect.anything()
      );
    });

    test("should not delete file when database does not exist", async () => {
      (FileSystem.getInfoAsync as jest.Mock)
        .mockImplementationOnce(() => {
          return Promise.resolve({ exists: true });
        })
        .mockImplementationOnce(() => {
          return Promise.resolve({ exists: false });
        });

      await storage.deleteDatabase();

      expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith(
        mockDbPath,
        expect.anything()
      );
    });
  });

  describe("resetDatabase", () => {
    test("should drop all tables and recreate them on the same connection", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (storage as any).dbInstance = mockDb;

      await storage.resetDatabase();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("SELECT name FROM sqlite_master")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("DROP TABLE IF EXISTS")
      );
      // Should NOT close the connection in the new implementation
      expect(mockDb.closeAsync).not.toHaveBeenCalled();
      // Should NOT open a new connection
      expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS")
      );
    });

    test("should handle reset errors and attempt recovery", async () => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (storage as any).dbInstance = mockDb;

      // Force an error during reset
      (mockDb.getAllAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Reset error");
      });

      // Mock successful recovery
      jest.spyOn(storage, "initializeDatabase").mockResolvedValueOnce(mockDb);

      const result = await storage.resetDatabase();

      expect(mockDb.closeAsync).toHaveBeenCalled();
      expect(result).toBe(mockDb);
    });
  });

  describe("resetUserProfileTable", () => {
    test("should drop and recreate only the user_profile table", async () => {
      await storage.resetUserProfileTable();

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        "DROP TABLE IF EXISTS user_profile"
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS user_profile")
      );
    });
  });
});
