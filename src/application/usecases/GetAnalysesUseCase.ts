import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

export class GetAnalysesUseCase {
  constructor(
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(): Promise<BiologicalAnalysis[]> {
    return this.repository.getAll();
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