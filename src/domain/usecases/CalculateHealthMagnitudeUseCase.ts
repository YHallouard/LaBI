import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { LAB_VALUE_KEYS } from "../../config/LabConfig";
import { GetAnalysesUseCase } from "./GetAnalysesUseCase";
import { LabValue } from "../../domain/entities/BiologicalAnalysis";
import { GetReferenceRangeUseCase } from "./GetReferenceRangeUseCase";

export type HealthMagnitudeDataPoint = {
  date: Date;
  magnitude: number;
};

export class CalculateHealthMagnitudeUseCase {
  constructor(
    private readonly getAnalysesUseCase: GetAnalysesUseCase,
    private readonly getReferenceRangeUseCase: GetReferenceRangeUseCase
  ) {}

  async execute(): Promise<HealthMagnitudeDataPoint[]> {
    await this.getReferenceRangeUseCase.initialize();
    const analyses = await this.getAnalysesUseCase.execute("asc");
    if (analyses.length === 0) {
      return [];
    }

    const normalizedValues = this.normalizeAnalyses(analyses);
    const filledValues = this.fillMissingValues(normalizedValues);
    return this.calculateMagnitudes(filledValues, analyses);
  }

  private normalizeAnalyses(
    analyses: BiologicalAnalysis[]
  ): (number | null)[][] {
    return analyses.map((analysis) => {
      return LAB_VALUE_KEYS.map((labKey) => {
        const labValue = analysis[labKey] as LabValue;
        const value = labValue?.value;
        const refRange = this.getReferenceRangeUseCase.execute(
          labKey,
          analysis.date
        );

        if (
          value === null ||
          value === undefined ||
          !refRange ||
          refRange.max === refRange.min
        ) {
          return null;
        }

        return (value - refRange.min) / (refRange.max - refRange.min) - 0.5;
      });
    });
  }

  private fillMissingValues(
    normalizedValues: (number | null)[][]
  ): (number | null)[][] {
    if (normalizedValues.length === 0) {
      return [];
    }

    const numRows = normalizedValues.length;
    const numCols = normalizedValues[0].length;
    const filled = JSON.parse(JSON.stringify(normalizedValues));

    for (let j = 0; j < numCols; j++) {
      // Forward fill
      let lastVal = null;
      for (let i = 0; i < numRows; i++) {
        if (filled[i][j] !== null) {
          lastVal = filled[i][j];
        } else if (lastVal !== null) {
          filled[i][j] = lastVal;
        }
      }

      // Backward fill
      let nextVal = null;
      for (let i = numRows - 1; i >= 0; i--) {
        if (filled[i][j] !== null) {
          nextVal = filled[i][j];
        } else if (nextVal !== null) {
          filled[i][j] = nextVal;
        }
      }
    }

    return filled;
  }

  private calculateMagnitudes(
    filledValues: (number | null)[][],
    analyses: BiologicalAnalysis[]
  ): HealthMagnitudeDataPoint[] {
    const validColumns = this.getValidColumns(filledValues);

    return filledValues.map((row, i) => {
      const values = validColumns
        .map((colIndex) => row[colIndex])
        .filter((v) => v !== null) as number[];

      if (values.length === 0) {
        return {
          date: analyses[i].date,
          magnitude: 0,
        };
      }

      const attentionMask = values.map((v) => (Math.abs(v) > 0.5 ? 1 : 0));
      const squaredValuesWithAttention = values.map(
        (v, idx) => v * v + attentionMask[idx]
      );
      const mean =
        squaredValuesWithAttention.reduce((a, b) => a + b, 0) /
        squaredValuesWithAttention.length;
      const magnitude = Math.sqrt(mean);

      return {
        date: analyses[i].date,
        magnitude: magnitude,
      };
    });
  }

  private getValidColumns(filledValues: (number | null)[][]): number[] {
    if (filledValues.length === 0) {
      return [];
    }
    const numCols = filledValues[0].length;
    const validColumns: number[] = [];

    for (let j = 0; j < numCols; j++) {
      if (filledValues.some((row) => row[j] !== null)) {
        validColumns.push(j);
      }
    }
    return validColumns;
  }
}
