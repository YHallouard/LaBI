import { UpdateAnalysisUseCase } from "../UpdateAnalysisUseCase";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../../domain/entities/BiologicalAnalysis";
import { InMemoryBiologicalAnalysisRepository } from "../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";

describe("UpdateAnalysisUseCase", () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: UpdateAnalysisUseCase;

  beforeEach(async () => {
    // Create a fresh repository instance for each test
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();

    // Create the use case with the repository
    useCase = new UpdateAnalysisUseCase(repository);

    // Spy on repository methods
    jest.spyOn(repository, "getById");
    jest.spyOn(repository, "save");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should update an existing analysis", async () => {
      // Given
      const originalAnalysis: BiologicalAnalysis = {
        id: "1",
        date: new Date("2023-01-01"),
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // Add test data to repository
      await repository.save(originalAnalysis);

      // Create updated version
      const updatedAnalysis = {
        ...originalAnalysis,
        Hematies: { value: 5.0, unit: "T/L" },
      };

      // When
      const result = await useCase.execute(updatedAnalysis);

      // Then
      expect(result).toEqual(updatedAnalysis);

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith("1");
      expect(repository.save).toHaveBeenCalledWith(updatedAnalysis);
      expect(repository.save).toHaveBeenCalledTimes(2); // Once in setup, once in execution

      // Verify the repository was updated
      const savedAnalysis = await repository.getById("1");
      expect((savedAnalysis?.Hematies as LabValue)?.value).toBe(5.0);
    });

    it("should throw error when analysis has no ID", async () => {
      // Given
      const mockAnalysis: BiologicalAnalysis = {
        id: "",
        date: new Date("2023-01-01"),
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // When/Then
      const error = new Error("Analysis ID is required for update");
      await expect(useCase.execute(mockAnalysis)).rejects.toThrow(error);

      // Verify repository methods were not called
      expect(repository.getById).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should throw error when analysis is not found", async () => {
      // Given
      const nonExistentId = "non-existent-id";
      const mockAnalysis: BiologicalAnalysis = {
        id: nonExistentId,
        date: new Date("2023-01-01"),
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // When/Then
      const error = new Error(`Analysis with ID ${nonExistentId} not found`);
      await expect(useCase.execute(mockAnalysis)).rejects.toThrow(error);

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith(nonExistentId);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("updateLabValue", () => {
    it("should update a specific lab value", async () => {
      // Given
      const originalAnalysis: BiologicalAnalysis = {
        id: "1",
        date: new Date("2023-01-01"),
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // Add test data to repository
      await repository.save(originalAnalysis);
      jest.clearAllMocks(); // Clear the save call from setup

      // When
      const result = await useCase.updateLabValue("1", "Hematies", 5.0);

      // Then
      expect(result.id).toBe("1");
      expect((result.Hematies as LabValue)?.value).toBe(5.0);
      expect((result.Hematies as LabValue)?.unit).toBe("T/L"); // Unit should not change

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith("1");
      expect(repository.save).toHaveBeenCalledTimes(1);

      // Verify the repository was updated
      const savedAnalysis = await repository.getById("1");
      expect((savedAnalysis?.Hematies as LabValue)?.value).toBe(5.0);
    });

    it("should update a lab value with a new unit", async () => {
      // Given
      const originalAnalysis: BiologicalAnalysis = {
        id: "1",
        date: new Date("2023-01-01"),
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // Add test data to repository
      await repository.save(originalAnalysis);
      jest.clearAllMocks(); // Clear the save call from setup

      // When
      const result = await useCase.updateLabValue("1", "Hematies", 5.0, "g/L");

      // Then
      expect(result.id).toBe("1");
      expect((result.Hematies as LabValue)?.value).toBe(5.0);
      expect((result.Hematies as LabValue)?.unit).toBe("g/L"); // Unit should change

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith("1");
      expect(repository.save).toHaveBeenCalledTimes(1);

      // Verify the repository was updated
      const savedAnalysis = await repository.getById("1");
      expect((savedAnalysis?.Hematies as LabValue)?.value).toBe(5.0);
      expect((savedAnalysis?.Hematies as LabValue)?.unit).toBe("g/L");
    });

    it("should add a new lab value if it does not exist", async () => {
      // Given
      const originalAnalysis: BiologicalAnalysis = {
        id: "1",
        date: new Date("2023-01-01"),
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // Add test data to repository
      await repository.save(originalAnalysis);
      jest.clearAllMocks(); // Clear the save call from setup

      // When
      const result = await useCase.updateLabValue(
        "1",
        "Leucocytes",
        8.5,
        "G/L"
      );

      // Then
      expect(result.id).toBe("1");
      expect((result.Hematies as LabValue)?.value).toBe(4.5); // Original value unchanged
      expect((result.Leucocytes as LabValue)?.value).toBe(8.5); // New value added
      expect((result.Leucocytes as LabValue)?.unit).toBe("G/L");

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith("1");
      expect(repository.save).toHaveBeenCalledTimes(1);

      // Verify the repository was updated
      const savedAnalysis = await repository.getById("1");
      expect((savedAnalysis?.Leucocytes as LabValue)?.value).toBe(8.5);
      expect((savedAnalysis?.Leucocytes as LabValue)?.unit).toBe("G/L");
    });

    it("should use empty string as default unit if not provided and no existing unit", async () => {
      // Given
      const originalAnalysis: BiologicalAnalysis = {
        id: "1",
        date: new Date("2023-01-01"),
        // No Leucocytes field
      };

      // Add test data to repository
      await repository.save(originalAnalysis);
      jest.clearAllMocks(); // Clear the save call from setup

      // When
      const result = await useCase.updateLabValue("1", "Leucocytes", 8.5);

      // Then
      expect((result.Leucocytes as LabValue)?.value).toBe(8.5);
      expect((result.Leucocytes as LabValue)?.unit).toBe(""); // Empty string as default

      // Verify the repository was updated
      const savedAnalysis = await repository.getById("1");
      expect((savedAnalysis?.Leucocytes as LabValue)?.unit).toBe("");
    });

    it("should throw error when analysis is not found", async () => {
      // Given
      const nonExistentId = "non-existent-id";

      // When/Then
      const error = new Error(`Analysis with ID ${nonExistentId} not found`);
      await expect(
        useCase.updateLabValue(nonExistentId, "Hematies", 5.0)
      ).rejects.toThrow(error);

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith(nonExistentId);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("updateDate", () => {
    it("should update the date of an analysis", async () => {
      // Given
      const originalDate = new Date("2023-01-01");
      const newDate = new Date("2023-02-15");

      const originalAnalysis: BiologicalAnalysis = {
        id: "1",
        date: originalDate,
        Hematies: { value: 4.5, unit: "T/L" },
      };

      // Add test data to repository
      await repository.save(originalAnalysis);
      jest.clearAllMocks(); // Clear the save call from setup

      // When
      const result = await useCase.updateDate("1", newDate);

      // Then
      expect(result.id).toBe("1");
      expect(result.date).toEqual(newDate);
      expect((result.Hematies as LabValue)?.value).toBe(4.5); // Lab values unchanged

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith("1");
      expect(repository.save).toHaveBeenCalledTimes(1);

      // Verify the repository was updated
      const savedAnalysis = await repository.getById("1");
      expect(savedAnalysis?.date).toEqual(newDate);
    });

    it("should throw error when analysis is not found during date update", async () => {
      // Given
      const nonExistentId = "non-existent-id";
      const newDate = new Date("2023-02-15");

      // When/Then
      const error = new Error(`Analysis with ID ${nonExistentId} not found`);
      await expect(useCase.updateDate(nonExistentId, newDate)).rejects.toThrow(
        error
      );

      // Verify repository methods were called correctly
      expect(repository.getById).toHaveBeenCalledWith(nonExistentId);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
