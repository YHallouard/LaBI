import { DeleteAnalysisUseCase } from '../DeleteAnalysisUseCase';
import { InMemoryBiologicalAnalysisRepository } from '../../../adapters/repositories/InMemoryBiologicalAnalysisRepository';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';

describe('DeleteAnalysisUseCase', () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: DeleteAnalysisUseCase;

  beforeEach(async () => {
    // Create a fresh repository instance for each test
    repository = new InMemoryBiologicalAnalysisRepository();
    await repository.clear();
    
    // Create the use case with the repository
    useCase = new DeleteAnalysisUseCase(repository);
  });

  describe('execute', () => {
    it('should delete analysis by ID from repository', async () => {
      // Prepare test data
      const mockAnalysis: BiologicalAnalysis = {
        id: '1',
        date: new Date('2023-01-01'),
        Hematies: { value: 4.5, unit: 'T/L' }
      };

      // Add test data to repository
      await repository.save(mockAnalysis);
      
      // Verify analysis exists before deletion
      const beforeDelete = await repository.getById('1');
      expect(beforeDelete).not.toBeNull();

      // Execute
      await useCase.execute('1');

      // Verify analysis was deleted
      const afterDelete = await repository.getById('1');
      expect(afterDelete).toBeNull();
    });

    it('should not throw error when deleting non-existent analysis', async () => {
      // Execute with non-existent ID
      await expect(useCase.execute('non-existent-id')).resolves.not.toThrow();
    });

    it('should throw error when no ID provided', async () => {
      // Execute and verify
      await expect(useCase.execute('')).rejects.toThrow('Analysis ID is required');
    });

    it('should throw error when repository fails', async () => {
      // Mock repository method to throw an error
      const originalMethod = repository.deleteById;
      repository.deleteById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Execute and verify
      await expect(useCase.execute('1')).rejects.toThrow('Database error');
      
      // Restore original method
      repository.deleteById = originalMethod;
    });
  });
}); 