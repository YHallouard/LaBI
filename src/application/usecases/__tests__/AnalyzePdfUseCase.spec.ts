import { AnalyzePdfUseCase } from "../AnalyzePdfUseCase";
import { InMemoryBiologicalAnalysisRepository } from "../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";
import { InMemoryOcrService } from "../../../adapters/services/InMemoryOcrService";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../../domain/entities/BiologicalAnalysis";
import { OcrResult } from "../../../ports/services/OcrService";
import { LAB_VALUE_KEYS } from "../../../config/LabConfig";
import { AnalysisProgressAdapter } from "../../../adapters/services/AnalysisProgressAdapter";

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mocked-uuid"),
}));

// Mock setTimeout
jest.useFakeTimers();

describe("AnalyzePdfUseCase", () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let ocrService: InMemoryOcrService;
  let useCase: AnalyzePdfUseCase;
  let mockOcrResult: Partial<OcrResult>;
  const mockPdfPath = "file://test.pdf";
  const mockDate = new Date("2023-01-01");

  beforeEach(async () => {
    // Create fresh repository and service instances
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();

    // Initialize OCR service with default test data
    mockOcrResult = {
      extractedDate: mockDate,
      Hematies: { value: 4.5, unit: "T/L" },
      "Proteine C Reactive": { value: 5.2, unit: "mg/L" },
    };
    ocrService = new InMemoryOcrService(mockOcrResult);

    // Create the use case
    useCase = new AnalyzePdfUseCase(ocrService, repository);

    // Spy on the methods
    jest.spyOn(ocrService, "extractDataFromPdf");
    jest.spyOn(repository, "save");

    // Create a spy for the private method
    // @ts-expect-error - accessing private method for testing
    jest.spyOn(useCase, "addLabValuesToAnalysis");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should extract data from PDF and save to repository", async () => {
      // Given preconditions set in beforeEach

      // When
      const result = await useCase.execute(mockPdfPath);

      // Then - verify result
      expect(result).toEqual({
        id: "mocked-uuid",
        date: mockDate,
        pdfSource: mockPdfPath,
        Hematies: { value: 4.5, unit: "T/L" },
        "Proteine C Reactive": { value: 5.2, unit: "mg/L" },
      });

      // Verify OCR service was called with correct path and progress processor
      expect(ocrService.extractDataFromPdf).toHaveBeenCalledWith(
        mockPdfPath,
        expect.any(AnalysisProgressAdapter)
      );
      expect(ocrService.extractDataFromPdf).toHaveBeenCalledTimes(1);

      // Verify repository was called with correct analysis
      expect(repository.save).toHaveBeenCalledWith(result);
      expect(repository.save).toHaveBeenCalledTimes(1);

      // Verify private addLabValuesToAnalysis was called with correct parameters
      // @ts-expect-error - accessing private method for testing
      expect(useCase.addLabValuesToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mocked-uuid" }),
        mockOcrResult
      );

      // Verify analysis was saved to repository
      const savedAnalysis = await repository.getById("mocked-uuid");
      expect(savedAnalysis).toEqual(result);
    });

    it("should process progress events correctly", async () => {
      // Given
      const onStepStartedMock = jest.fn();
      const onStepCompletedMock = jest.fn();

      useCase.onProcessingStepStarted(onStepStartedMock);
      useCase.onProcessingStepCompleted(onStepCompletedMock);

      // Configure the InMemoryOcrService to use ProgressProcessor
      jest
        .spyOn(ocrService, "extractDataFromPdf")
        .mockImplementation(async (path, processor) => {
          if (processor) {
            processor.onStepStarted("Mock extraction");
            processor.onStepCompleted("Mock extraction");
          }
          return mockOcrResult as OcrResult;
        });

      // When
      await useCase.execute(mockPdfPath);

      // Run the timers to process the setTimeout for "Uploading document to Mistral" completion
      jest.runAllTimers();

      // Then - verify the progress callbacks were called
      // Uploading document step
      expect(onStepStartedMock).toHaveBeenCalledWith("Uploading document to Mistral");
      expect(onStepCompletedMock).toHaveBeenCalledWith("Uploading document to Mistral");

      // Mock extraction step
      expect(onStepStartedMock).toHaveBeenCalledWith("Mock extraction");
      expect(onStepCompletedMock).toHaveBeenCalledWith("Mock extraction");

      // Saving analysis step
      expect(onStepStartedMock).toHaveBeenCalledWith("Saving analysis");
      expect(onStepCompletedMock).toHaveBeenCalledWith("Saving analysis");

      // Verify call counts - 3 steps, each with start and complete
      expect(onStepStartedMock).toHaveBeenCalledTimes(3);
      expect(onStepCompletedMock).toHaveBeenCalledTimes(3);
    });

    it("should not notify steps when callbacks are not provided", async () => {
      // Given
      // Reset callbacks using removeProcessingListeners
      useCase.removeProcessingListeners();

      // When
      await useCase.execute(mockPdfPath);

      // Then
      // The OCR service should have been called with a progress processor
      expect(ocrService.extractDataFromPdf).toHaveBeenCalledWith(
        mockPdfPath,
        expect.any(AnalysisProgressAdapter)
      );

      // The repository save should have been called
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it("should add only defined lab values to the analysis", async () => {
      // Given
      const partialOcrResult: Partial<OcrResult> = {
        extractedDate: mockDate,
        Hematies: { value: 4.5, unit: "T/L" },
        // Other lab values not defined
      };
      ocrService = new InMemoryOcrService(partialOcrResult);
      jest.spyOn(ocrService, "extractDataFromPdf");
      useCase = new AnalyzePdfUseCase(ocrService, repository);
      // @ts-expect-error - accessing private method for testing
      jest.spyOn(useCase, "addLabValuesToAnalysis");

      // When
      const result = await useCase.execute(mockPdfPath);

      // Then - check basic properties
      expect(result.id).toBe("mocked-uuid");
      expect(result.date).toEqual(mockDate);
      expect(result.pdfSource).toBe(mockPdfPath);

      // The analysis should only have the Hematies key from the lab values
      LAB_VALUE_KEYS.forEach((key) => {
        if (key === "Hematies") {
          expect(result).toHaveProperty(key);
          expect((result as Record<string, LabValue>)[key]).toEqual({
            value: 4.5,
            unit: "T/L",
          });
        } else {
          expect(
            (result as Record<string, LabValue | undefined>)[key]
          ).toBeUndefined();
        }
      });

      // Verify addLabValuesToAnalysis was called correctly
      // @ts-expect-error - accessing private method for testing
      expect(useCase.addLabValuesToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mocked-uuid" }),
        partialOcrResult
      );

      // Verify analysis was saved to repository
      const savedAnalysis = await repository.getById("mocked-uuid");
      expect(savedAnalysis).toEqual(result);
    });

    it("should handle multiple lab values correctly", async () => {
      // Given - create an OCR result with all lab values
      const fullOcrResult: Partial<OcrResult> = {
        extractedDate: mockDate,
      };

      // Add all lab values to the OCR result
      LAB_VALUE_KEYS.forEach((key) => {
        fullOcrResult[key] = { value: 1.0, unit: "test" };
      });

      ocrService = new InMemoryOcrService(fullOcrResult);
      useCase = new AnalyzePdfUseCase(ocrService, repository);
      // @ts-expect-error - accessing private method for testing
      jest.spyOn(useCase, "addLabValuesToAnalysis");

      // When
      const result = await useCase.execute(mockPdfPath);

      // Then
      expect(result.id).toBe("mocked-uuid");
      expect(result.date).toEqual(mockDate);

      // Verify all lab values were added
      LAB_VALUE_KEYS.forEach((key) => {
        expect(result).toHaveProperty(key);
        expect((result as Record<string, LabValue>)[key]).toEqual({
          value: 1.0,
          unit: "test",
        });
      });

      // Verify addLabValuesToAnalysis was called with all lab values
      // @ts-expect-error - accessing private method for testing
      expect(useCase.addLabValuesToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mocked-uuid" }),
        fullOcrResult
      );
    });

    it("should handle empty lab values (null OCR result)", async () => {
      // Given
      const emptyOcrResult: Partial<OcrResult> = {
        extractedDate: mockDate,
        // No lab values at all
      };

      ocrService = new InMemoryOcrService(emptyOcrResult);
      useCase = new AnalyzePdfUseCase(ocrService, repository);
      // @ts-expect-error - accessing private method for testing
      jest.spyOn(useCase, "addLabValuesToAnalysis");

      // When
      const result = await useCase.execute(mockPdfPath);

      // Then
      expect(result.id).toBe("mocked-uuid");
      expect(result.date).toEqual(mockDate);
      expect(result.pdfSource).toBe(mockPdfPath);

      // Verify no lab values were added
      LAB_VALUE_KEYS.forEach((key) => {
        expect(
          (result as Record<string, LabValue | undefined>)[key]
        ).toBeUndefined();
      });

      // Verify addLabValuesToAnalysis was called with empty OCR result
      // @ts-expect-error - accessing private method for testing
      expect(useCase.addLabValuesToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mocked-uuid" }),
        emptyOcrResult
      );
    });

    it("should throw error when OCR service fails", async () => {
      // Given
      const expectedError = new Error("OCR service error");
      ocrService.extractDataFromPdf = jest
        .fn()
        .mockRejectedValue(expectedError);

      // When/Then
      await expect(useCase.execute(mockPdfPath)).rejects.toThrow(expectedError);

      // Verify service was called but repository was not
      expect(ocrService.extractDataFromPdf).toHaveBeenCalledTimes(1);
      expect(repository.save).not.toHaveBeenCalled();
      // @ts-expect-error - accessing private method for testing
      expect(useCase.addLabValuesToAnalysis).not.toHaveBeenCalled();

      // Verify no analysis was saved
      const allAnalyses = await repository.getAll();
      expect(allAnalyses.length).toBe(0);
    });

    it("should throw error when repository save fails", async () => {
      // Given
      const expectedError = new Error("Repository save error");
      repository.save = jest.fn().mockRejectedValue(expectedError);

      // When/Then
      await expect(useCase.execute(mockPdfPath)).rejects.toThrow(expectedError);

      // Verify service was called
      expect(ocrService.extractDataFromPdf).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      // @ts-expect-error - accessing private method for testing
      expect(useCase.addLabValuesToAnalysis).toHaveBeenCalledTimes(1);
    });

    it("should handle different PDF paths correctly", async () => {
      // Given
      const differentPdfPath = "file://different.pdf";

      // When
      const result = await useCase.execute(differentPdfPath);

      // Then
      expect(result.pdfSource).toBe(differentPdfPath);
      expect(ocrService.extractDataFromPdf).toHaveBeenCalledWith(
        differentPdfPath,
        expect.any(AnalysisProgressAdapter)
      );
    });

    // Test specifically for the conditional in addLabValuesToAnalysis
    it("should skip lab values that are falsy but not null", async () => {
      // Given - create OCR result with falsy values (undefined, 0, empty string)
      const specialOcrResult: Partial<OcrResult> = {
        extractedDate: mockDate,
        Hematies: { value: 4.5, unit: "T/L" },
        "Proteine C Reactive": undefined, // Undefined value (should be skipped)
        Leucocytes: { value: 0, unit: "G/L" }, // Zero value (should be added)
        Plaquettes: null, // Null value (should be skipped)
        CCMH: { value: "" as unknown as number, unit: "g/dL" }, // Empty string value (should be added)
      };

      ocrService = new InMemoryOcrService(specialOcrResult);
      useCase = new AnalyzePdfUseCase(ocrService, repository);

      // When
      const result = await useCase.execute(mockPdfPath);

      // Then - check which values were added
      expect(result.Hematies).toEqual({ value: 4.5, unit: "T/L" });
      expect(result["Proteine C Reactive"]).toBeUndefined(); // Undefined skipped
      expect(result.Leucocytes).toEqual({ value: 0, unit: "G/L" }); // Zero value added
      expect(result.Plaquettes).toBeUndefined(); // Null skipped
      expect(result.CCMH).toEqual({
        value: "" as unknown as number,
        unit: "g/dL",
      }); // Empty string added
    });
  });

  describe("progress callbacks", () => {
    it("should register and call step callbacks", () => {
      // Given
      const onStepStartedMock = jest.fn();
      const onStepCompletedMock = jest.fn();

      // When registering callbacks
      useCase.onProcessingStepStarted(onStepStartedMock);
      useCase.onProcessingStepCompleted(onStepCompletedMock);

      // Then calling private notify methods should trigger callbacks
      // @ts-expect-error - accessing private method for testing
      useCase.notifyStepStarted("Test step");
      // @ts-expect-error - accessing private method for testing
      useCase.notifyStepCompleted("Test step");

      // Verify callbacks were called
      expect(onStepStartedMock).toHaveBeenCalledWith("Test step");
      expect(onStepCompletedMock).toHaveBeenCalledWith("Test step");
    });

    it("should not call callbacks after removeProcessingListeners", () => {
      // Given
      const onStepStartedMock = jest.fn();
      const onStepCompletedMock = jest.fn();

      // Register callbacks
      useCase.onProcessingStepStarted(onStepStartedMock);
      useCase.onProcessingStepCompleted(onStepCompletedMock);

      // When removing listeners
      useCase.removeProcessingListeners();

      // Then calling private notify methods should not trigger callbacks
      // @ts-expect-error - accessing private method for testing
      useCase.notifyStepStarted("Test step");
      // @ts-expect-error - accessing private method for testing
      useCase.notifyStepCompleted("Test step");

      // Verify callbacks were not called
      expect(onStepStartedMock).not.toHaveBeenCalled();
      expect(onStepCompletedMock).not.toHaveBeenCalled();
    });
  });

  describe("addLabValuesToAnalysis", () => {
    it("should directly test the addLabValuesToAnalysis method", async () => {
      // Given
      const analysis: BiologicalAnalysis = {
        id: "test-id",
        date: mockDate,
        pdfSource: mockPdfPath,
      };

      const ocrResult: Partial<OcrResult> = {
        Hematies: { value: 5.0, unit: "T/L" },
        VGM: { value: 85, unit: "fL" },
        CCMH: null,
      };

      // When - call the private method directly
      // @ts-expect-error - accessing private method for testing
      useCase.addLabValuesToAnalysis(analysis, ocrResult);

      // Then - verify lab values were added correctly
      expect(analysis.Hematies).toEqual({ value: 5.0, unit: "T/L" });
      expect(analysis.VGM).toEqual({ value: 85, unit: "fL" });
      expect(analysis.CCMH).toBeUndefined(); // Null values should be skipped

      // Verify other properties remain unchanged
      expect(analysis.id).toBe("test-id");
      expect(analysis.date).toBe(mockDate);
      expect(analysis.pdfSource).toBe(mockPdfPath);
    });

    it("should not add any properties if ocrResult lab values are all falsy", async () => {
      // Given
      const analysis: BiologicalAnalysis = {
        id: "test-id",
        date: mockDate,
        pdfSource: mockPdfPath,
      };

      const ocrResult: Partial<OcrResult> = {
        extractedDate: mockDate,
        // All lab values are missing
      };

      // Create a clean copy to compare later
      const originalAnalysis = { ...analysis };

      // When - call the private method directly
      // @ts-expect-error - accessing private method for testing
      useCase.addLabValuesToAnalysis(analysis, ocrResult);

      // Then - verify no lab values were added
      expect(analysis).toEqual(originalAnalysis);
    });

    it("should work with different lab value types correctly", async () => {
      // Given
      const analysis: BiologicalAnalysis = {
        id: "test-id",
        date: mockDate,
        pdfSource: mockPdfPath,
      };

      // Prepare different types of lab values
      const ocrResult: Partial<OcrResult> = {
        Hematies: { value: 4.5, unit: "T/L" }, // Regular value
        VGM: { value: 0, unit: "fL" }, // Zero value (should be added)
        CCMH: { value: null as unknown as number, unit: "g/dL" }, // Null value inside object (should be added)
        Leucocytes: null, // Null value (should be skipped)
        Plaquettes: undefined, // Undefined value (should be skipped)
        "Proteine C Reactive": undefined, // Empty string (should be skipped)
      };

      // When - call the private method directly
      // @ts-expect-error - accessing private method for testing
      useCase.addLabValuesToAnalysis(analysis, ocrResult);

      // Then - verify lab values were added correctly
      expect(analysis.Hematies).toEqual({ value: 4.5, unit: "T/L" });
      expect(analysis.VGM).toEqual({ value: 0, unit: "fL" });
      expect(analysis.CCMH).toEqual({ value: null, unit: "g/dL" });
      expect(analysis.Leucocytes).toBeUndefined();
      expect(analysis.Plaquettes).toBeUndefined();
      expect(analysis["Proteine C Reactive"]).toBeUndefined();
    });
  });
});
