import { CreateManualAnalysisUseCase } from "../CreateManualAnalysisUseCase";
import { InMemoryBiologicalAnalysisRepository } from "../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";
import { LabValue } from "../../../domain/entities/BiologicalAnalysis";

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("manual-uuid"),
}));

describe("CreateManualAnalysisUseCase", () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: CreateManualAnalysisUseCase;
  const mockDate = new Date("2025-09-15");

  beforeEach(async () => {
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();
    jest.spyOn(repository, "save");
    useCase = new CreateManualAnalysisUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should create an analysis with a generated UUID and the provided date", async () => {
      // Given
      const input = { date: mockDate, values: {} };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.id).toBe("manual-uuid");
      expect(result.date).toBe(mockDate);
      expect(result.pdfSource).toBeUndefined();
    });

    it("should save the analysis to the repository", async () => {
      // Given
      const input = { date: mockDate, values: {} };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(result);

      const saved = await repository.getById("manual-uuid");
      expect(saved).toEqual(result);
    });

    it("should attach provided lab values as LabValue entries", async () => {
      // Given
      const input = {
        date: mockDate,
        values: {
          Hémoglobine: { value: 14.2, unit: "g/dL" },
          Leucocytes: { value: 6.8, unit: "giga/L" },
        },
      };

      // When
      const result = await useCase.execute(input);

      // Then
      expect((result as Record<string, LabValue>)["Hémoglobine"]).toEqual({
        value: 14.2,
        unit: "g/dL",
      });
      expect((result as Record<string, LabValue>)["Leucocytes"]).toEqual({
        value: 6.8,
        unit: "giga/L",
      });
    });

    it("should create an analysis with no lab values when values is empty", async () => {
      // Given
      const input = { date: mockDate, values: {} };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.id).toBe("manual-uuid");
      expect(result.date).toBe(mockDate);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "manual-uuid", date: mockDate })
      );
    });

    it("should throw if the repository save fails", async () => {
      // Given
      const expectedError = new Error("DB write failed");
      repository.save = jest.fn().mockRejectedValue(expectedError);
      const input = { date: mockDate, values: {} };

      // When / Then
      await expect(useCase.execute(input)).rejects.toThrow(expectedError);
    });

    it("should not add pdfSource to the analysis", async () => {
      // Given
      const input = { date: mockDate, values: {} };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.pdfSource).toBeUndefined();
    });
  });
});
