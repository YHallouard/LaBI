import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

export class GetAnalysesUseCase {
  constructor(
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(): Promise<BiologicalAnalysis[]> {
    console.log('GetAnalysesUseCase.execute() called');
    try {
      const results = await this.repository.getAll();
      console.log('GetAnalysesUseCase received results:', results.length);
      return results;
    } catch (error) {
      console.error('Error in GetAnalysesUseCase.execute():', error);
      throw error;
    }
  }
}

export class GetAnalysisByIdUseCase {
  constructor(
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(id: string): Promise<BiologicalAnalysis | null> {
    return this.repository.getById(id);
  }
} 