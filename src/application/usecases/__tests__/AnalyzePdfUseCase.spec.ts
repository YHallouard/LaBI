import { AnalyzePdfUseCase } from '../AnalyzePdfUseCase';
import { InMemoryBiologicalAnalysisRepository } from '../../../adapters/repositories/InMemoryBiologicalAnalysisRepository';
import { InMemoryOcrService } from '../../../adapters/services/InMemoryOcrService';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { OcrResult } from '../../../ports/services/OcrService';
import { LAB_VALUE_KEYS } from '../../../config/LabConfig';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid')
}));

describe('AnalyzePdfUseCase', () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let ocrService: InMemoryOcrService;
  let useCase: AnalyzePdfUseCase;
  const mockPdfPath = 'file://test.pdf';

  beforeEach(async () => {
    // Create fresh repository and service instances
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();
    
    // Initialize OCR service with default test data
    const mockDate = new Date('2023-01-01');
    const mockOcrResult: Partial<OcrResult> = {
      extractedDate: mockDate,
      Hematies: { value: 4.5, unit: 'T/L' },
      'Proteine C Reactive': { value: 5.2, unit: 'mg/L' }
    };
    ocrService = new InMemoryOcrService(mockOcrResult);
    
    // Create the use case
    useCase = new AnalyzePdfUseCase(ocrService, repository);
  });

  describe('execute', () => {
    it('should extract data from PDF and save to repository', async () => {
      // Execute
      const result = await useCase.execute(mockPdfPath);

      // Expected analysis structure
      const expectedAnalysis: BiologicalAnalysis = {
        id: 'mocked-uuid',
        date: new Date('2023-01-01'),
        pdfSource: mockPdfPath,
        Hematies: { value: 4.5, unit: 'T/L' },
        'Proteine C Reactive': { value: 5.2, unit: 'mg/L' }
      };

      // Verify returned result
      expect(result.id).toBe('mocked-uuid');
      expect(result.date).toEqual(new Date('2023-01-01'));
      expect(result.pdfSource).toBe(mockPdfPath);
      expect(result.Hematies).toEqual({ value: 4.5, unit: 'T/L' });
      expect(result['Proteine C Reactive']).toEqual({ value: 5.2, unit: 'mg/L' });
      
      // Verify analysis was saved to repository
      const savedAnalysis = await repository.getById('mocked-uuid');
      expect(savedAnalysis).not.toBeNull();
      expect(savedAnalysis?.date).toEqual(new Date('2023-01-01'));
    });

    it('should add only defined lab values to the analysis', async () => {
      // Set up OCR service to return only some lab values
      const partialOcrResult: Partial<OcrResult> = {
        extractedDate: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
        // Other lab values not defined
      };
      ocrService = new InMemoryOcrService(partialOcrResult);
      useCase = new AnalyzePdfUseCase(ocrService, repository);

      // Execute
      const result = await useCase.execute(mockPdfPath);

      // Verify the result
      expect(result.id).toBe('mocked-uuid');
      expect(result.date).toEqual(new Date('2023-01-01'));
      
      // The analysis should only have the Hematies key from the lab values
      LAB_VALUE_KEYS.forEach(key => {
        if (key === 'Hematies') {
          expect(result).toHaveProperty(key);
          expect((result as any)[key]).toEqual({ value: 4.5, unit: 'T/L' });
        } else {
          expect((result as any)[key]).toBeUndefined();
        }
      });
      
      // Verify analysis was saved to repository
      const savedAnalysis = await repository.getById('mocked-uuid');
      expect(savedAnalysis).not.toBeNull();
      expect(savedAnalysis?.Hematies).toEqual({ value: 4.5, unit: 'T/L' });
    });

    it('should throw error when OCR service fails', async () => {
      // Mock OCR service to throw an error
      ocrService.extractDataFromPdf = jest.fn().mockRejectedValue(new Error('OCR service error'));
      
      // Execute and verify
      await expect(useCase.execute(mockPdfPath)).rejects.toThrow('OCR service error');
      
      // Verify no analysis was saved
      const allAnalyses = await repository.getAll();
      expect(allAnalyses.length).toBe(0);
    });

    it('should throw error when repository save fails', async () => {
      // Mock repository to throw an error
      const originalMethod = repository.save;
      repository.save = jest.fn().mockRejectedValue(new Error('Repository save error'));

      // Execute and verify
      await expect(useCase.execute(mockPdfPath)).rejects.toThrow('Repository save error');
      
      // Restore original method
      repository.save = originalMethod;
    });
  });
}); 