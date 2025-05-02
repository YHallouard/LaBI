import { MistralOcrService } from '../MistralOcrService';
import { OcrResult } from '../../../ports/services/OcrService';
import * as FileSystem from 'expo-file-system';
import { Mistral } from '@mistralai/mistralai';
import { LAB_VALUE_KEYS, LAB_VALUE_UNITS } from '../../../config/LabConfig';
import { LabValue } from '../../../domain/entities/BiologicalAnalysis';

// Mock external dependencies
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' }
}));

// Mock Mistral client
jest.mock('@mistralai/mistralai', () => {
  const mockGetSignedUrl = jest.fn().mockResolvedValue({
    url: 'https://mock-signed-url.com'
  });
  
  const mockComplete = jest.fn();
  
  return {
    Mistral: jest.fn().mockImplementation(() => ({
      chat: {
        complete: mockComplete
      },
      files: {
        getSignedUrl: mockGetSignedUrl
      }
    }))
  };
});

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;
global.atob = jest.fn().mockImplementation(str => str);
// Define FormData mock
const mockFormData = {
  append: jest.fn()
};
// @ts-ignore - Ignore the FormData TypeScript error for testing
global.FormData = jest.fn().mockImplementation(() => mockFormData);

describe('MistralOcrService', () => {
  let service: MistralOcrService;
  const mockApiKey = 'test-api-key';
  const mockPdfPath = 'file://test.pdf';
  const mockBase64Content = 'base64-encoded-content';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockBase64Content);
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'mock-file-id' })
    });
    
    // Create service instance
    service = new MistralOcrService(mockApiKey);
  });
  
  describe('extractDataFromPdf', () => {
    it('should extract data successfully from a PDF', async () => {
      // Get mock implementations
      const mockMistralModule = jest.requireMock('@mistralai/mistralai');
      const mockComplete = mockMistralModule.Mistral().chat.complete;
      const mockGetSignedUrl = mockMistralModule.Mistral().files.getSignedUrl;
      
      // Mock chat completion response
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                DATE: '2023-06-15',
                Hematies: { value: 4.5, unit: 'T/L' },
                'Proteine C Reactive': { value: 5.2, unit: 'mg/L' }
              })
            }
          }
        ]
      });
      
      // Call the method
      const result = await service.extractDataFromPdf(mockPdfPath);
      
      // Verify file was read
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        mockPdfPath,
        { encoding: FileSystem.EncodingType.Base64 }
      );
      
      // Verify file was uploaded
      expect(fetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/files',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`
          })
        })
      );
      
      // Verify the signed URL was requested
      expect(mockGetSignedUrl).toHaveBeenCalledWith({
        fileId: 'mock-file-id'
      });
      
      // Verify chat completion was called
      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mistral-large-latest',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({ 
                  type: 'document_url',
                  documentUrl: 'https://mock-signed-url.com'
                })
              ])
            })
          ])
        })
      );
      
      // Verify the returned data
      expect(result).toHaveProperty('extractedDate');
      expect(result.extractedDate).toBeInstanceOf(Date);
      expect(result.extractedDate.toISOString()).toContain('2023-06-15');
      
      // Verify lab values were extracted
      LAB_VALUE_KEYS.forEach(key => {
        expect(result).toHaveProperty(key);
        
        const labValue = result[key] as LabValue | undefined;
        if (labValue) {
          if (key === 'Hematies') {
            expect(labValue.value).toBe(4.5);
            expect(labValue.unit).toBe('T/L');
          } else if (key === 'Proteine C Reactive') {
            expect(labValue.value).toBe(5.2);
            expect(labValue.unit).toBe('mg/L');
          } else {
            // All other keys should have default values
            expect(labValue.value).toBe(0);
            expect(labValue.unit).toBe(LAB_VALUE_UNITS[key] || '');
          }
        }
      });
    });
    
    it('should handle API errors and return fallback values', async () => {
      // Get mock implementations
      const mockMistralModule = jest.requireMock('@mistralai/mistralai');
      const mockComplete = mockMistralModule.Mistral().chat.complete;
      
      // Mock chat completion to throw an error
      mockComplete.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await service.extractDataFromPdf(mockPdfPath);
      
      // Verify fallback values are returned
      expect(result).toHaveProperty('extractedDate');
      expect(result.extractedDate).toBeInstanceOf(Date);
      
      // Verify all lab values have default values
      LAB_VALUE_KEYS.forEach(key => {
        expect(result).toHaveProperty(key);
        const labValue = result[key] as LabValue | undefined;
        if (labValue) {
          expect(labValue.value).toBe(0);
          expect(labValue.unit).toBe(LAB_VALUE_UNITS[key] || '');
        }
      });
    });
    
    it('should handle file upload errors', async () => {
      // Mock fetch to return an error
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request'
      });
      
      // Call the method and expect it to throw
      await expect(service.extractDataFromPdf(mockPdfPath)).rejects.toThrow('File upload failed');
    });
    
    it('should handle file reading errors', async () => {
      // Mock file reading to throw an error
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(new Error('File reading error'));
      
      // Call the method and expect it to throw
      await expect(service.extractDataFromPdf(mockPdfPath)).rejects.toThrow('File reading error');
    });
    
    it('should handle invalid JSON in API response', async () => {
      // Get mock implementations
      const mockMistralModule = jest.requireMock('@mistralai/mistralai');
      const mockComplete = mockMistralModule.Mistral().chat.complete;
      
      // Mock chat completion response with non-JSON content
      mockComplete.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is not JSON'
            }
          }
        ]
      });
      
      // Call the method
      const result = await service.extractDataFromPdf(mockPdfPath);
      
      // Verify default values are returned
      expect(result).toHaveProperty('extractedDate');
      
      // Verify all lab values have default values
      LAB_VALUE_KEYS.forEach(key => {
        expect(result).toHaveProperty(key);
        const labValue = result[key] as LabValue | undefined;
        if (labValue) {
          expect(labValue.value).toBe(0);
        }
      });
    });
  });
}); 