import { MistralOcrService } from "../MistralOcrService";
import * as FileSystem from "expo-file-system";
import { LAB_VALUE_KEYS, LAB_VALUE_UNITS } from "../../../config/LabConfig";
import { LabValue } from "../../../domain/entities/BiologicalAnalysis";

// Spy on console methods
let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

// Mock external dependencies
jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: "base64" },
}));

// Mock Mistral client
jest.mock("@mistralai/mistralai", () => {
  const mockGetSignedUrl = jest.fn().mockResolvedValue({
    url: "https://mock-signed-url.com",
  });

  const mockComplete = jest.fn();

  return {
    Mistral: jest.fn().mockImplementation(() => ({
      chat: {
        complete: mockComplete,
      },
      files: {
        getSignedUrl: mockGetSignedUrl,
      },
    })),
  };
});

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;
global.atob = jest.fn().mockImplementation((str) => str);
// Define FormData mock
const mockFormData = {
  append: jest.fn(),
};
// @ts-expect-error - Ignore the FormData TypeScript error for testing
global.FormData = jest.fn().mockImplementation(() => mockFormData);

describe("MistralOcrService", () => {
  let service: MistralOcrService;
  const mockApiKey = "test-api-key";
  const mockPdfPath = "file://test.pdf";
  const mockBase64Content = "base64-encoded-content";

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      mockBase64Content
    );

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: "mock-file-id" }),
    });

    // Setup console spies
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Create service instance
    service = new MistralOcrService(mockApiKey);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("extractDataFromPdf", () => {
    it("should extract data successfully from a PDF", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;
      const mockGetSignedUrl = mockMistralModule.Mistral().files.getSignedUrl;

      // Mock chat completion response
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                DATE: "2023-06-15",
                Hematies: { value: 4.5, unit: "T/L" },
                "Proteine C Reactive": { value: 5.2, unit: "mg/L" },
              }),
            },
          },
        ],
      });

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify file was read
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(mockPdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify file was uploaded
      expect(fetch).toHaveBeenCalledWith(
        "https://api.mistral.ai/v1/files",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );

      // Verify the signed URL was requested
      expect(mockGetSignedUrl).toHaveBeenCalledWith({
        fileId: "mock-file-id",
      });

      // Verify chat completion was called
      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "mistral-large-latest",
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({
              role: "user",
              content: expect.arrayContaining([
                expect.objectContaining({ type: "text" }),
                expect.objectContaining({
                  type: "document_url",
                  documentUrl: "https://mock-signed-url.com",
                }),
              ]),
            }),
          ]),
        })
      );

      // Verify the returned data
      expect(result).toHaveProperty("extractedDate");
      expect(result.extractedDate).toBeInstanceOf(Date);
      expect(result.extractedDate.toISOString()).toContain("2023-06-15");

      // Verify lab values were extracted
      LAB_VALUE_KEYS.forEach((key) => {
        expect(result).toHaveProperty(key);

        if (key === "Hematies") {
          expect(result[key]).toBeDefined();
          expect((result[key] as LabValue)?.value).toBe(4.5);
          expect((result[key] as LabValue)?.unit).toBe("T/L");
        } else if (key === "Proteine C Reactive") {
          expect(result[key]).toBeDefined();
          expect((result[key] as LabValue)?.value).toBe(5.2);
          expect((result[key] as LabValue)?.unit).toBe("mg/L");
        } else {
          // All other keys should have fallback values
          expect(result[key]).toBeDefined();
          // Skip value checks for other keys as they may be default values or undefined
        }
      });

      // Verify logs
      expect(consoleLogSpy).toHaveBeenCalledWith("Reading PDF file...");
      expect(consoleLogSpy).toHaveBeenCalledWith("PDF file read successfully");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "File uploaded successfully:",
        { id: "mock-file-id" }
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("Signed URL:", {
        url: "https://mock-signed-url.com",
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Received response from Mistral API"
      );
    });

    it("should handle API errors and return fallback values", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;
      const expectedError = new Error("API Error");

      // Mock chat completion to throw an error
      mockComplete.mockRejectedValue(expectedError);

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify logs
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error:", expectedError);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Using fallback values due to API error"
      );

      // Verify fallback values are returned
      expect(result).toHaveProperty("extractedDate");
      expect(result.extractedDate).toBeInstanceOf(Date);

      // Verify all lab values have default values
      LAB_VALUE_KEYS.forEach((key) => {
        expect(result).toHaveProperty(key);
        expect(result[key]).toBeDefined();
        expect((result[key] as LabValue)?.value).toBe(0);
        expect((result[key] as LabValue)?.unit).toBe(
          LAB_VALUE_UNITS[key] || ""
        );
      });
    });

    it("should handle file upload errors", async () => {
      // Given
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
      });

      // When/Then
      await expect(service.extractDataFromPdf(mockPdfPath)).rejects.toThrow(
        "File upload failed: Bad Request"
      );

      // Verify logs
      expect(consoleLogSpy).toHaveBeenCalledWith("Reading PDF file...");
      expect(consoleLogSpy).toHaveBeenCalledWith("PDF file read successfully");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in OCR service:",
        expect.any(Error)
      );
    });

    it("should handle file reading errors", async () => {
      // Given
      const expectedError = new Error("File reading error");
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(
        expectedError
      );

      // When/Then
      await expect(service.extractDataFromPdf(mockPdfPath)).rejects.toThrow(
        "File reading error"
      );

      // Verify logs
      expect(consoleLogSpy).toHaveBeenCalledWith("Reading PDF file...");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in OCR service:",
        expectedError
      );
    });

    it("should handle invalid JSON in API response", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;

      // Mock chat completion response with non-JSON content
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: "This is not JSON",
            },
          },
        ],
      });

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify parsing failure was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Raw response content:",
        "This is not JSON"
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "JSON parsing failed, trying regex extraction",
        expect.any(SyntaxError)
      );

      // Verify default values are returned
      expect(result).toHaveProperty("extractedDate");

      // Verify all lab values have fallback values
      LAB_VALUE_KEYS.forEach((key) => {
        expect(result).toHaveProperty(key);
        expect(result[key]).toBeDefined();
      });
    });

    it("should handle partial lab values from API response", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;

      // Create a response with only some lab values and null values
      const partialResponse = {
        DATE: "2023-06-15",
        Hematies: { value: 4.5, unit: "T/L" },
        "Vitamine B12": null, // Explicitly null
        // Other values missing
      };

      // Mock chat completion response with partial data
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(partialResponse),
            },
          },
        ],
      });

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify parsed values
      expect(result.extractedDate.toISOString()).toContain("2023-06-15");
      expect((result.Hematies as LabValue).value).toBe(4.5);
      expect((result.Hematies as LabValue).unit).toBe("T/L");
      expect(result["Vitamine B12"]).toBeNull(); // Should preserve null

      // Other missing values should get default values
      LAB_VALUE_KEYS.forEach((key) => {
        if (key !== "Hematies" && key !== "Vitamine B12") {
          // Only check that the property exists
          expect(result).toHaveProperty(key);
        }
      });
    });

    it("should handle lab values without units", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;

      // Mock response with missing units
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                DATE: "2023-06-15",
                Hematies: { value: 4.5 }, // No unit
                "Proteine C Reactive": { value: 5.2, unit: "mg/L" },
              }),
            },
          },
        ],
      });

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify the unit was added from LAB_VALUE_UNITS
      expect((result.Hematies as LabValue).unit).toBe("T/L"); // Should use default unit
    });

    it("should handle invalid or missing date in API response", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;

      // Mock response with invalid date
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                DATE: "not-a-date",
                Hematies: { value: 4.5, unit: "T/L" },
              }),
            },
          },
        ],
      });

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - should have a valid fallback date
      expect(result.extractedDate).toBeInstanceOf(Date);

      // Try with no date at all
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                Hematies: { value: 4.5, unit: "T/L" },
                // No DATE field
              }),
            },
          },
        ],
      });

      // When
      const result2 = await service.extractDataFromPdf(mockPdfPath);

      // Then - should have a valid fallback date
      expect(result2.extractedDate).toBeInstanceOf(Date);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No DATE found in response, using current date"
      );
    });

    it("should handle invalid response format from API", async () => {
      // Given
      const mockMistralModule = jest.requireMock("@mistralai/mistralai");
      const mockComplete = mockMistralModule.Mistral().chat.complete;

      // Mock chat completion with empty response
      mockComplete.mockResolvedValue({});

      // When
      const result = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify fallback values are used
      expect(result).toHaveProperty("extractedDate");
      expect(result.extractedDate).toBeInstanceOf(Date);

      // All lab values should be default values
      LAB_VALUE_KEYS.forEach((key) => {
        expect(result).toHaveProperty(key);
      });

      // Try with empty choices array
      mockComplete.mockResolvedValue({ choices: [] });

      // When
      const result2 = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify fallback values
      expect(result2).toHaveProperty("extractedDate");

      // Try with missing content
      mockComplete.mockResolvedValue({
        choices: [{ message: {} }],
      });

      // When
      const result3 = await service.extractDataFromPdf(mockPdfPath);

      // Then - verify fallback values
      expect(result3).toHaveProperty("extractedDate");

      // Verify all lab values have fallback values
      LAB_VALUE_KEYS.forEach((key) => {
        expect(result3).toHaveProperty(key);
      });
    });
  });
});
