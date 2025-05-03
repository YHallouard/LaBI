import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

export type DataPoint = {
  date: Date;
  value: number | null;
  timestamp: number;
};

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

export class GetLabTestDataUseCase {
  execute(analyses: BiologicalAnalysis[], labKey: string): DataPoint[] {
    return analyses
      .map(analysis => {
        const labData = (analysis as any)[labKey];
        
        return {
          date: new Date(analysis.date),
          value: labData && 
                 typeof labData.value === 'number' && 
                 !Number.isNaN(labData.value) ? 
                 labData.value : 
                 null,
          timestamp: new Date(analysis.date).getTime()
        };
      })
      .filter(point => point.value !== null && point.value !== 0);
  }
}
