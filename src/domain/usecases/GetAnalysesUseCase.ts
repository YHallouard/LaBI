import {
  BiologicalAnalysis,
  LabValue,
} from "../../domain/entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";

export type DataPoint = {
  date: Date;
  value: number | null;
  timestamp: number;
};

export type SortOrder = "asc" | "desc";

export class GetAnalysesUseCase {
  constructor(private readonly repository: BiologicalAnalysisRepository) {}

  async execute(sortByDate?: SortOrder): Promise<BiologicalAnalysis[]> {
    console.log("GetAnalysesUseCase.execute() called");

    try {
      const results = await this.repository.getAll();
      console.log("GetAnalysesUseCase received results:", results.length);
      return this.applySorting(results, sortByDate);
    } catch (error) {
      console.error("Error in GetAnalysesUseCase.execute():", error);
      throw error;
    }
  }

  private applySorting(
    analyses: BiologicalAnalysis[],
    sortByDate?: SortOrder
  ): BiologicalAnalysis[] {
    if (!sortByDate) {
      return analyses;
    }

    return [...analyses].sort((a, b) => {
      if (sortByDate === "desc") {
        return b.date.getTime() - a.date.getTime();
      } else {
        return a.date.getTime() - b.date.getTime();
      }
    });
  }
}

export class GetAnalysisByIdUseCase {
  constructor(private readonly repository: BiologicalAnalysisRepository) {}

  async execute(id: string): Promise<BiologicalAnalysis | null> {
    return this.repository.getById(id);
  }
}

export class GetLabTestDataUseCase {
  execute(analyses: BiologicalAnalysis[], labKey: string): DataPoint[] {
    return analyses
      .map((analysis) => {
        const labData = (analysis as BiologicalAnalysis)[labKey] as LabValue;

        return {
          date: new Date(analysis.date),
          value:
            labData &&
            typeof labData.value === "number" &&
            !Number.isNaN(labData.value)
              ? labData.value
              : null,
          timestamp: new Date(analysis.date).getTime(),
        };
      })
      .filter((point) => point.value !== null && point.value !== 0);
  }
}
