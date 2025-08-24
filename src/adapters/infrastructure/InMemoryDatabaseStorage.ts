import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { UserProfile } from "../../domain/UserProfile";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";

export class InMemoryDatabaseStorage implements DatabaseStoragePort {
  private inMemoryData: Record<
    string,
    BiologicalAnalysis[] | UserProfile[] | string[]
  > = {
    biological_analyses: [],
    user_profile: [],
    api_keys: [],
    pinned_metrics: [],
  };

  // Test control flags
  private shouldFailInitialize = false;
  private shouldFailExport = false;
  private shouldFailImport = false;
  private shouldFailReset = false;
  private shouldFailDelete = false;
  private shouldFailDatabaseExists = false;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async initializeDatabase(): Promise<any> {
    if (this.shouldFailInitialize) {
      throw new Error("Database initialization failed");
    }

    console.log("[InMemoryDatabaseStorage] Database initialized");
    return {
      // Mock database instance
      /* eslint-disable @typescript-eslint/no-unused-vars */
      getFirstAsync: async (query: string) => ({ result: "mock" }),
      /* eslint-disable @typescript-eslint/no-unused-vars */
      getAllAsync: async (query: string) => [],
      /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
      runAsync: async (query: string, params?: any[]) => ({ changes: 0 }),
      closeAsync: async () => {},
    };
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async getDatabase(): Promise<any> {
    return this.initializeDatabase();
  }

  async databaseExists(): Promise<boolean> {
    if (this.shouldFailDatabaseExists) {
      throw new Error("Database exists check failed");
    }

    return true; // Always return true for in-memory storage
  }

  async deleteDatabase(): Promise<void> {
    if (this.shouldFailDelete) {
      throw new Error("Database deletion failed");
    }

    this.inMemoryData = {
      biological_analyses: [],
      user_profile: [],
      api_keys: [],
      pinned_metrics: [],
    };

    console.log("[InMemoryDatabaseStorage] Database deleted");
  }

  async resetDatabase(): Promise<any> {
    if (this.shouldFailReset) {
      throw new Error("Database reset failed");
    }

    this.inMemoryData = {
      biological_analyses: [],
      user_profile: [],
      api_keys: [],
      pinned_metrics: [],
    };

    console.log("[InMemoryDatabaseStorage] Database reset");
    return this.initializeDatabase();
  }

  async exportData(): Promise<any> {
    if (this.shouldFailExport) {
      throw new Error("Data export failed");
    }

    console.log("[InMemoryDatabaseStorage] Exporting data:", {
      biological_analyses: this.inMemoryData.biological_analyses.length,
      user_profile: this.inMemoryData.user_profile.length,
      api_keys: this.inMemoryData.api_keys.length,
      pinned_metrics: this.inMemoryData.pinned_metrics.length,
    });

    return {
      biological_analyses: this.inMemoryData.biological_analyses,
      user_profile: this.inMemoryData.user_profile,
      api_keys: this.inMemoryData.api_keys,
      pinned_metrics: this.inMemoryData.pinned_metrics,
    };
  }

  async importData(data: any): Promise<void> {
    if (this.shouldFailImport) {
      throw new Error("Data import failed");
    }

    if (!data) {
      console.warn("[InMemoryDatabaseStorage] No data provided for import");
      return;
    }

    // Import biological analyses
    if (data.biological_analyses && Array.isArray(data.biological_analyses)) {
      this.inMemoryData.biological_analyses = [...data.biological_analyses];
    }

    // Import user profile
    if (data.user_profile && Array.isArray(data.user_profile)) {
      this.inMemoryData.user_profile = [...data.user_profile];
    }

    // Import API keys
    if (data.api_keys && Array.isArray(data.api_keys)) {
      this.inMemoryData.api_keys = [...data.api_keys];
    }

    // Import pinned metrics
    if (data.pinned_metrics && Array.isArray(data.pinned_metrics)) {
      this.inMemoryData.pinned_metrics = [...data.pinned_metrics];
    }

    console.log("[InMemoryDatabaseStorage] Data imported:", {
      biological_analyses: this.inMemoryData.biological_analyses.length,
      user_profile: this.inMemoryData.user_profile.length,
      api_keys: this.inMemoryData.api_keys.length,
      pinned_metrics: this.inMemoryData.pinned_metrics.length,
    });
  }

  // Test helper methods
  _setShouldFailInitialize(shouldFail: boolean): void {
    this.shouldFailInitialize = shouldFail;
  }

  _setShouldFailExport(shouldFail: boolean): void {
    this.shouldFailExport = shouldFail;
  }

  _setShouldFailImport(shouldFail: boolean): void {
    this.shouldFailImport = shouldFail;
  }

  _setShouldFailReset(shouldFail: boolean): void {
    this.shouldFailReset = shouldFail;
  }

  _setShouldFailDelete(shouldFail: boolean): void {
    this.shouldFailDelete = shouldFail;
  }

  _setShouldFailDatabaseExists(shouldFail: boolean): void {
    this.shouldFailDatabaseExists = shouldFail;
  }

  _setExportDataResult(result: any): void {
    this.inMemoryData = result;
  }

  _getInMemoryData(): any {
    return this.inMemoryData;
  }

  _addBiologicalAnalysis(analysis: any): void {
    this.inMemoryData.biological_analyses.push(analysis);
  }

  _addUserProfile(profile: any): void {
    this.inMemoryData.user_profile.push(profile);
  }

  _addApiKey(apiKey: any): void {
    this.inMemoryData.api_keys.push(apiKey);
  }

  _addPinnedMetrics(metrics: any): void {
    this.inMemoryData.pinned_metrics.push(metrics);
  }

  _clearData(): void {
    this.inMemoryData = {
      biological_analyses: [],
      user_profile: [],
      api_keys: [],
      pinned_metrics: [],
    };
  }
}
