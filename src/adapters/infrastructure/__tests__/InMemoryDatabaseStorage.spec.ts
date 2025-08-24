import { InMemoryDatabaseStorage } from "../InMemoryDatabaseStorage";

describe("InMemoryDatabaseStorage", () => {
  let inMemoryDatabaseStorage: InMemoryDatabaseStorage;

  beforeEach(() => {
    inMemoryDatabaseStorage = new InMemoryDatabaseStorage();
  });

  describe("Initialization", () => {
    it("should initialize database successfully", async () => {
      const result = await inMemoryDatabaseStorage.initializeDatabase();

      expect(result).toBeDefined();
      expect(result.getFirstAsync).toBeDefined();
      expect(result.getAllAsync).toBeDefined();
      expect(result.runAsync).toBeDefined();
      expect(result.closeAsync).toBeDefined();
    });

    it("should handle initialization failure", async () => {
      inMemoryDatabaseStorage._setShouldFailInitialize(true);

      await expect(
        inMemoryDatabaseStorage.initializeDatabase()
      ).rejects.toThrow("Database initialization failed");
    });
  });

  describe("Database Operations", () => {
    it("should return database instance", async () => {
      const result = await inMemoryDatabaseStorage.getDatabase();

      expect(result).toBeDefined();
    });

    it("should always return true for database exists", async () => {
      const exists = await inMemoryDatabaseStorage.databaseExists();

      expect(exists).toBe(true);
    });

    it("should handle database exists failure", async () => {
      inMemoryDatabaseStorage._setShouldFailDatabaseExists(true);

      await expect(inMemoryDatabaseStorage.databaseExists()).rejects.toThrow(
        "Database exists check failed"
      );
    });
  });

  describe("Data Management", () => {
    it("should export data successfully", async () => {
      const testData = {
        biological_analyses: [{ id: "test1" }],
        user_profile: [{ id: "profile1" }],
        api_keys: [{ id: "key1" }],
        pinned_metrics: [{ id: "metric1" }],
      };

      inMemoryDatabaseStorage._setExportDataResult(testData);

      const exportedData = await inMemoryDatabaseStorage.exportData();

      expect(exportedData).toEqual(testData);
    });

    it("should handle export data failure", async () => {
      inMemoryDatabaseStorage._setShouldFailExport(true);

      await expect(inMemoryDatabaseStorage.exportData()).rejects.toThrow(
        "Data export failed"
      );
    });

    it("should import data successfully", async () => {
      const testData = {
        biological_analyses: [{ id: "test1", name: "Test Analysis" }],
        user_profile: [{ id: "profile1", name: "Test Profile" }],
        api_keys: [{ id: "key1", key: "test-key" }],
        pinned_metrics: [{ id: "metric1", name: "Test Metric" }],
      };

      await inMemoryDatabaseStorage.importData(testData);

      const importedData = inMemoryDatabaseStorage._getInMemoryData();
      expect(importedData.biological_analyses).toEqual(
        testData.biological_analyses
      );
      expect(importedData.user_profile).toEqual(testData.user_profile);
      expect(importedData.api_keys).toEqual(testData.api_keys);
      expect(importedData.pinned_metrics).toEqual(testData.pinned_metrics);
    });

    it("should handle import data failure", async () => {
      inMemoryDatabaseStorage._setShouldFailImport(true);

      await expect(inMemoryDatabaseStorage.importData({})).rejects.toThrow(
        "Data import failed"
      );
    });

    it("should handle null data import gracefully", async () => {
      await expect(
        inMemoryDatabaseStorage.importData(null)
      ).resolves.not.toThrow();
    });
  });

  describe("Database Reset and Delete", () => {
    it("should reset database successfully", async () => {
      // Add some data first
      inMemoryDatabaseStorage._addBiologicalAnalysis({ id: "test1" });
      inMemoryDatabaseStorage._addUserProfile({ id: "profile1" });

      const result = await inMemoryDatabaseStorage.resetDatabase();

      expect(result).toBeDefined();

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.biological_analyses).toEqual([]);
      expect(data.user_profile).toEqual([]);
    });

    it("should handle reset database failure", async () => {
      inMemoryDatabaseStorage._setShouldFailReset(true);

      await expect(inMemoryDatabaseStorage.resetDatabase()).rejects.toThrow(
        "Database reset failed"
      );
    });

    it("should delete database successfully", async () => {
      // Add some data first
      inMemoryDatabaseStorage._addBiologicalAnalysis({ id: "test1" });
      inMemoryDatabaseStorage._addUserProfile({ id: "profile1" });

      await inMemoryDatabaseStorage.deleteDatabase();

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.biological_analyses).toEqual([]);
      expect(data.user_profile).toEqual([]);
    });

    it("should handle delete database failure", async () => {
      inMemoryDatabaseStorage._setShouldFailDelete(true);

      await expect(inMemoryDatabaseStorage.deleteDatabase()).rejects.toThrow(
        "Database deletion failed"
      );
    });
  });

  describe("Test Helper Methods", () => {
    it("should add biological analysis", () => {
      const analysis = { id: "test1", name: "Test Analysis" };

      inMemoryDatabaseStorage._addBiologicalAnalysis(analysis);

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.biological_analyses).toContain(analysis);
    });

    it("should add user profile", () => {
      const profile = { id: "profile1", name: "Test Profile" };

      inMemoryDatabaseStorage._addUserProfile(profile);

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.user_profile).toContain(profile);
    });

    it("should add API key", () => {
      const apiKey = { id: "key1", key: "test-key" };

      inMemoryDatabaseStorage._addApiKey(apiKey);

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.api_keys).toContain(apiKey);
    });

    it("should add pinned metrics", () => {
      const metric = { id: "metric1", name: "Test Metric" };

      inMemoryDatabaseStorage._addPinnedMetrics(metric);

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.pinned_metrics).toContain(metric);
    });

    it("should clear all data", () => {
      // Add some data first
      inMemoryDatabaseStorage._addBiologicalAnalysis({ id: "test1" });
      inMemoryDatabaseStorage._addUserProfile({ id: "profile1" });
      inMemoryDatabaseStorage._addApiKey({ id: "key1" });
      inMemoryDatabaseStorage._addPinnedMetrics({ id: "metric1" });

      inMemoryDatabaseStorage._clearData();

      const data = inMemoryDatabaseStorage._getInMemoryData();
      expect(data.biological_analyses).toEqual([]);
      expect(data.user_profile).toEqual([]);
      expect(data.api_keys).toEqual([]);
      expect(data.pinned_metrics).toEqual([]);
    });
  });
});
