import { v4 as uuidv4 } from "uuid";
import { BiologicalAnalysis, LabValue } from "../../domain/entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";

export interface ManualLabValues {
  [labKey: string]: { value: number; unit: string };
}

export class CreateManualAnalysisUseCase {
  constructor(
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(input: { date: Date; values: ManualLabValues }): Promise<BiologicalAnalysis> {
    const analysis: BiologicalAnalysis = {
      id: uuidv4(),
      date: input.date,
    };

    Object.entries(input.values).forEach(([labKey, { value, unit }]) => {
      const labValue: LabValue = { value, unit };
      (analysis as Record<string, unknown>)[labKey] = labValue;
    });

    await this.repository.save(analysis);
    return analysis;
  }
}
