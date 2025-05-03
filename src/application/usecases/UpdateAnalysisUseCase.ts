import { BiologicalAnalysis, LabValue } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

export class UpdateAnalysisUseCase {
  constructor(
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(analysis: BiologicalAnalysis): Promise<BiologicalAnalysis> {
    if (!analysis.id) {
      throw new Error('Analysis ID is required for update');
    }
    
    const existingAnalysis = await this.repository.getById(analysis.id);
    if (!existingAnalysis) {
      throw new Error(`Analysis with ID ${analysis.id} not found`);
    }
    
    await this.repository.save(analysis);
    
    return analysis;
  }

  async updateLabValue(
    analysisId: string, 
    labKey: string, 
    value: number, 
    unit?: string
  ): Promise<BiologicalAnalysis> {
    const analysis = await this.repository.getById(analysisId);
    if (!analysis) {
      throw new Error(`Analysis with ID ${analysisId} not found`);
    }
    
    const existingLabValue = (analysis as any)[labKey] as LabValue | undefined;
    const updatedUnit = unit || (existingLabValue?.unit || '');
    
    (analysis as any)[labKey] = {
      value: value,
      unit: updatedUnit
    };

    await this.repository.save(analysis);
    
    return analysis;
  }

  async updateDate(
    analysisId: string,
    date: Date
  ): Promise<BiologicalAnalysis> {
    const analysis = await this.repository.getById(analysisId);
    if (!analysis) {
      throw new Error(`Analysis with ID ${analysisId} not found`);
    }
    
    analysis.date = date;
    
    await this.repository.save(analysis);
    
    return analysis;
  }
}
