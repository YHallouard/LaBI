import { SQLiteBiologicalAnalysisRepository } from "../SQLiteBiologicalAnalysisRepository";
import { BiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";
import { DatabaseStoragePort } from "../../../ports/infrastructure/DatabaseStoragePort";

// Mock database implementation
const mockDb = {
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([
    {
      id: "test-id",
      date: "2023-06-15T10:00:00.000Z",
      pdf_source: "file://test.pdf",
      lab_values: '{"some_lab_value":{"value":5.2,"unit":"mg/L"}}',
    },
  ]),
  getFirstAsync: jest.fn().mockResolvedValue({
    id: "test-id",
    date: "2023-06-15T10:00:00.000Z",
    pdf_source: "file://test.pdf",
    lab_values: '{"some_lab_value":{"value":5.2,"unit":"mg/L"}}',
  }),
};

// Mock database storage port
const mockDatabaseStorage: DatabaseStoragePort = {
  getDatabase: jest.fn().mockResolvedValue(mockDb),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  databaseExists: jest.fn().mockResolvedValue(true),
  deleteDatabase: jest.fn().mockResolvedValue(undefined),
  resetDatabase: jest.fn().mockResolvedValue(undefined),
  exportData: jest.fn().mockResolvedValue({
    biological_analyses: [],
    user_profile: [],
  }),
  importData: jest.fn().mockResolvedValue(undefined),
};

describe("SQLiteBiologicalAnalysisRepository", () => {
  let repository: SQLiteBiologicalAnalysisRepository;
  let sampleAnalysis: BiologicalAnalysis;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    repository = new SQLiteBiologicalAnalysisRepository(mockDatabaseStorage);

    // Wait for initialization to complete
    await repository.initialize();

    sampleAnalysis = {
      id: "test-id",
      date: new Date("2023-06-15T10:00:00.000Z"),
      pdfSource: "file://test.pdf",
    };
  });

  test("should save analysis without throwing", async () => {
    await expect(repository.save(sampleAnalysis)).resolves.not.toThrow();
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  test("should get all analyses", async () => {
    const analyses = await repository.getAll();
    expect(analyses.length).toBe(1);
    expect(analyses[0].id).toBe("test-id");
    expect(mockDb.getAllAsync).toHaveBeenCalled();
  });

  test("should get analysis by ID", async () => {
    const analysis = await repository.getById("test-id");
    expect(analysis).not.toBeNull();
    if (analysis) {
      expect(analysis.id).toBe("test-id");
    }
    expect(mockDb.getFirstAsync).toHaveBeenCalled();
  });

  test("should delete analysis without throwing", async () => {
    await expect(repository.deleteById("test-id")).resolves.not.toThrow();
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  describe("Error handling", () => {
    test("should throw error when database initialization fails", async () => {
      const failingDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(null),
      };

      const failingRepository = new SQLiteBiologicalAnalysisRepository(
        failingDbStorage
      );
      // The constructor automatically calls initialize(), so we need to wait for it to reject
      await expect(failingRepository["initialized"]).rejects.toThrow(
        "Failed to initialize database"
      );
    });

    test("should handle and rethrow errors in save method", async () => {
      const errorDb = {
        ...mockDb,
        runAsync: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      const errorDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(errorDb),
      };

      const errorRepository = new SQLiteBiologicalAnalysisRepository(
        errorDbStorage
      );
      await errorRepository["initialized"];

      await expect(errorRepository.save(sampleAnalysis)).rejects.toThrow(
        "Database error"
      );
    });

    test("should handle and rethrow errors in getAll method", async () => {
      const errorDb = {
        ...mockDb,
        getAllAsync: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      const errorDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(errorDb),
      };

      const errorRepository = new SQLiteBiologicalAnalysisRepository(
        errorDbStorage
      );
      await errorRepository["initialized"];

      await expect(errorRepository.getAll()).rejects.toThrow("Database error");
    });

    test("should handle and rethrow errors in getById method", async () => {
      const errorDb = {
        ...mockDb,
        getFirstAsync: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      const errorDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(errorDb),
      };

      const errorRepository = new SQLiteBiologicalAnalysisRepository(
        errorDbStorage
      );
      await errorRepository["initialized"]; // Wait for initialization to complete

      await expect(errorRepository.getById("test-id")).rejects.toThrow(
        "Database error"
      );
    });

    test("should handle and rethrow errors in deleteById method", async () => {
      const errorDb = {
        ...mockDb,
        runAsync: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      const errorDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(errorDb),
      };

      const errorRepository = new SQLiteBiologicalAnalysisRepository(
        errorDbStorage
      );
      await errorRepository["initialized"]; // Wait for initialization to complete

      await expect(errorRepository.deleteById("test-id")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("Edge cases", () => {
    test("should return null when analysis is not found by ID", async () => {
      const emptyDb = {
        ...mockDb,
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };

      const emptyDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(emptyDb),
      };

      const emptyRepository = new SQLiteBiologicalAnalysisRepository(
        emptyDbStorage
      );
      await emptyRepository["initialized"];

      const result = await emptyRepository.getById("non-existent-id");
      expect(result).toBeNull();
    });

    test("should handle analysis with lab values correctly", async () => {
      const analysisWithLabValues = {
        ...sampleAnalysis,
        Hémoglobine: { value: 15.2, unit: "g/dL" },
        Glycémie: { value: 0.9, unit: "g/l" },
      };

      await repository.save(analysisWithLabValues);

      const savedLabValuesJson = JSON.stringify({
        Hémoglobine: { value: 15.2, unit: "g/dL" },
        Glycémie: { value: 0.9, unit: "g/l" },
      });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO biological_analyses"),
        [
          analysisWithLabValues.id,
          analysisWithLabValues.date.toISOString(),
          analysisWithLabValues.pdfSource || null,
          savedLabValuesJson,
        ]
      );
    });

    test("should handle analysis without pdfSource", async () => {
      const analysisWithoutPdfSource = {
        id: "test-id-no-pdf",
        date: new Date("2023-06-15T10:00:00.000Z"),
      };

      await repository.save(analysisWithoutPdfSource);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO biological_analyses"),
        expect.arrayContaining([
          analysisWithoutPdfSource.id,
          analysisWithoutPdfSource.date.toISOString(),
          null,
          expect.any(String),
        ])
      );
    });

    test("should handle analysis with valid lab values JSON", async () => {
      const validJsonDb = {
        ...mockDb,
        getFirstAsync: jest.fn().mockResolvedValue({
          id: "test-id",
          date: "2023-06-15T10:00:00.000Z",
          pdf_source: "file://test.pdf",
          lab_values: '{"Hémoglobine":{"value":15.2,"unit":"g/dL"}}',
        }),
      };

      const validJsonDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(validJsonDb),
      };

      const validJsonRepository = new SQLiteBiologicalAnalysisRepository(
        validJsonDbStorage
      );
      await validJsonRepository["initialized"];

      const result = await validJsonRepository.getById("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      // The lab value should be added to the analysis object
      expect((result as Record<string, unknown>)["Hémoglobine"]).toEqual({
        value: 15.2,
        unit: "g/dL",
      });
    });

    test("should handle invalid JSON in lab_values gracefully", async () => {
      const invalidJsonDb = {
        ...mockDb,
        getFirstAsync: jest.fn().mockResolvedValue({
          id: "test-id",
          date: "2023-06-15T10:00:00.000Z",
          pdf_source: "file://test.pdf",
          lab_values: "{invalid json",
        }),
      };

      const invalidJsonDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(invalidJsonDb),
      };

      const validJsonRepository = new SQLiteBiologicalAnalysisRepository(
        invalidJsonDbStorage
      );
      await validJsonRepository["initialized"];

      const result = await validJsonRepository.getById("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.pdfSource).toBe("file://test.pdf");
      expect(result?.date).toEqual(new Date("2023-06-15T10:00:00.000Z"));

      const analysisKeys = Object.keys(result as BiologicalAnalysis);
      expect(analysisKeys).toEqual(["id", "date", "pdfSource"]);
    });

    test("should create analysis without lab_values when lab_values is null", async () => {
      const noLabValuesDb = {
        ...mockDb,
        getFirstAsync: jest.fn().mockResolvedValue({
          id: "test-id",
          date: "2023-06-15T10:00:00.000Z",
          pdf_source: "file://test.pdf",
          lab_values: null,
        }),
      };

      const noLabValuesDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(noLabValuesDb),
      };

      const noLabValuesRepository = new SQLiteBiologicalAnalysisRepository(
        noLabValuesDbStorage
      );
      await noLabValuesRepository["initialized"];

      const result = await noLabValuesRepository.getById("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.pdfSource).toBe("file://test.pdf");
    });
  });
});
