import { v4 as uuidv4 } from "uuid";
import { BiologicalAnalysis } from "../entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";

export class CreateAnalysisUseCase {
  constructor(private readonly repository: BiologicalAnalysisRepository) {}

  async execute(analysis: BiologicalAnalysis): Promise<BiologicalAnalysis> {
    const toPersist: BiologicalAnalysis = {
      ...analysis,
      id: analysis.id || uuidv4(),
    };
    await this.repository.save(toPersist);
    return toPersist;
  }
}
