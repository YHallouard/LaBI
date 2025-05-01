import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

export class DeleteAnalysisUseCase {
  private repository: BiologicalAnalysisRepository;

  constructor(repository: BiologicalAnalysisRepository) {
    this.repository = repository;
  }

  async execute(analysisId: string): Promise<void> {
    if (!analysisId) {
      throw new Error('Analysis ID is required');
    }
    
    return this.repository.deleteById(analysisId);
  }
} 