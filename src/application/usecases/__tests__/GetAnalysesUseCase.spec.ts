import { GetAnalysesUseCase, GetAnalysisByIdUseCase } from '../GetAnalysesUseCase';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { InMemoryBiologicalAnalysisRepository } from '../../../adapters/repositories/InMemoryBiologicalAnalysisRepository';

describe('GetAnalysesUseCase', () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: GetAnalysesUseCase;

  beforeEach(async () => {
    // Create a fresh repository instance for each test
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();
    
    // Create the use case with the repository
    useCase = new GetAnalysesUseCase(repository);
  });

  describe('execute', () => {
    it('should return analyses from repository', async () => {
      // Prepare test data
      const mockAnalyses: BiologicalAnalysis[] = [
        {
          id: '1',
          date: new Date('2023-01-01'),
          Hematies: { value: 4.5, unit: 'T/L' }
        },
        {
          id: '2',
          date: new Date('2023-01-02'),
          Hematies: { value: 4.7, unit: 'T/L' }
        }
      ];

      // Add test data to repository
      await repository.save(mockAnalyses[0]);
      await repository.save(mockAnalyses[1]);

      // Execute
      const result = await useCase.execute();

      // Verify
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('2'); // Newest first
      expect(result[1].id).toBe('1');
    });

    it('should return an empty array when no analyses exist', async () => {
      // Execute with empty repository
      const result = await useCase.execute();

      // Verify
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should throw error when repository fails', async () => {
      // Mock repository method to throw an error
      const originalMethod = repository.getAll;
      repository.getAll = jest.fn().mockRejectedValue(new Error('Database error'));

      // Execute and verify
      await expect(useCase.execute()).rejects.toThrow('Database error');
      
      // Restore original method
      repository.getAll = originalMethod;
    });
  });
});

describe('GetAnalysisByIdUseCase', () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: GetAnalysisByIdUseCase;

  beforeEach(async () => {
    // Create a fresh repository instance for each test
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();
    
    // Create the use case with the repository
    useCase = new GetAnalysisByIdUseCase(repository);
  });

  describe('execute', () => {
    it('should return analysis by ID from repository', async () => {
      // Prepare test data
      const mockAnalysis: BiologicalAnalysis = {
        id: '1',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Add test data to repository
      await repository.save(mockAnalysis);

      // Execute
      const result = await useCase.execute('1');

      // Verify
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.date).toEqual(mockAnalysis.date);
      expect(result?.Hematies).toEqual(mockAnalysis.Hematies);
    });

    it('should return null when analysis not found', async () => {
      // Execute with non-existent ID
      const result = await useCase.execute('non-existent-id');

      // Verify
      expect(result).toBeNull();
    });

    it('should throw error when repository fails', async () => {
      // Mock repository method to throw an error
      const originalMethod = repository.getById;
      repository.getById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Execute and verify
      await expect(useCase.execute('1')).rejects.toThrow('Database error');
      
      // Restore original method
      repository.getById = originalMethod;
    });
  });
}); 