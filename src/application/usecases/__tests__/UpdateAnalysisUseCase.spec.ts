import { UpdateAnalysisUseCase } from '../UpdateAnalysisUseCase';
import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { InMemoryBiologicalAnalysisRepository } from '../../../adapters/repositories/InMemoryBiologicalAnalysisRepository';

describe('UpdateAnalysisUseCase', () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: UpdateAnalysisUseCase;

  beforeEach(async () => {
    // Create a fresh repository instance for each test
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();
    
    // Create the use case with the repository
    useCase = new UpdateAnalysisUseCase(repository);
  });

  describe('execute', () => {
    it('should update an existing analysis', async () => {
      // Prepare test data
      const originalAnalysis: BiologicalAnalysis = {
        id: '1',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Add test data to repository
      await repository.save(originalAnalysis);
      
      // Create updated version
      const updatedAnalysis = { 
        ...originalAnalysis, 
        Hematies: { value: 5.0, unit: 'T/L' } 
      };

      // Execute
      const result = await useCase.execute(updatedAnalysis);

      // Verify the returned result
      expect(result).toEqual(updatedAnalysis);
      
      // Verify the repository was updated
      const savedAnalysis = await repository.getById('1');
      expect((savedAnalysis?.Hematies as LabValue)?.value).toBe(5.0);
    });

    it('should throw error when analysis has no ID', async () => {
      // Prepare test data with no ID
      const mockAnalysis: BiologicalAnalysis = {
        id: '',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Execute and verify
      await expect(useCase.execute(mockAnalysis)).rejects.toThrow('Analysis ID is required for update');
    });

    it('should throw error when analysis is not found', async () => {
      // Prepare test data with non-existent ID
      const mockAnalysis: BiologicalAnalysis = {
        id: 'non-existent-id',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Execute and verify
      await expect(useCase.execute(mockAnalysis)).rejects.toThrow(
        'Analysis with ID non-existent-id not found'
      );
    });
  });

  describe('updateLabValue', () => {
    it('should update a specific lab value', async () => {
      // Prepare test data
      const originalAnalysis: BiologicalAnalysis = {
        id: '1',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Add test data to repository
      await repository.save(originalAnalysis);

      // Execute
      const result = await useCase.updateLabValue('1', 'Hematies', 5.0);

      // Verify the returned result
      expect(result.id).toBe('1');
      expect((result.Hematies as LabValue)?.value).toBe(5.0);
      expect((result.Hematies as LabValue)?.unit).toBe('T/L'); // Unit should not change
      
      // Verify the repository was updated
      const savedAnalysis = await repository.getById('1');
      expect((savedAnalysis?.Hematies as LabValue)?.value).toBe(5.0);
    });

    it('should update a lab value with a new unit', async () => {
      // Prepare test data
      const originalAnalysis: BiologicalAnalysis = {
        id: '1',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Add test data to repository
      await repository.save(originalAnalysis);

      // Execute
      const result = await useCase.updateLabValue('1', 'Hematies', 5.0, 'g/L');

      // Verify the returned result
      expect(result.id).toBe('1');
      expect((result.Hematies as LabValue)?.value).toBe(5.0);
      expect((result.Hematies as LabValue)?.unit).toBe('g/L'); // Unit should change
      
      // Verify the repository was updated
      const savedAnalysis = await repository.getById('1');
      expect((savedAnalysis?.Hematies as LabValue)?.value).toBe(5.0);
      expect((savedAnalysis?.Hematies as LabValue)?.unit).toBe('g/L');
    });

    it('should add a new lab value if it does not exist', async () => {
      // Prepare test data with no Leucocytes
      const originalAnalysis: BiologicalAnalysis = {
        id: '1',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Add test data to repository
      await repository.save(originalAnalysis);

      // Execute
      const result = await useCase.updateLabValue('1', 'Leucocytes', 8.5, 'G/L');

      // Verify the returned result
      expect(result.id).toBe('1');
      expect((result.Hematies as LabValue)?.value).toBe(4.5); // Original value unchanged
      expect((result.Leucocytes as LabValue)?.value).toBe(8.5); // New value added
      expect((result.Leucocytes as LabValue)?.unit).toBe('G/L');
      
      // Verify the repository was updated
      const savedAnalysis = await repository.getById('1');
      expect((savedAnalysis?.Leucocytes as LabValue)?.value).toBe(8.5);
      expect((savedAnalysis?.Leucocytes as LabValue)?.unit).toBe('G/L');
    });

    it('should throw error when analysis is not found', async () => {
      // Execute with a non-existent ID
      await expect(useCase.updateLabValue('non-existent-id', 'Hematies', 5.0)).rejects.toThrow(
        'Analysis with ID non-existent-id not found'
      );
    });
  });
}); 