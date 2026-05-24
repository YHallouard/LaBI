import {
  CreateLinePathUseCase,
  DataPoint,
  ChartDimensions,
} from "./CreateLinePathUseCase";
import {
  CreateReferenceAreaPathUseCase,
  DynamicReferenceRangePoint,
} from "./CreateReferenceAreaPathUseCase";
import { GetReferenceRangeUseCase } from "./GetReferenceRangeUseCase";

export interface MiniChartData {
  linePath: string;
  referenceAreaPaths: string[];
}

export class CreateMiniChartsUseCase {
  private createLinePathUseCase: CreateLinePathUseCase;
  private createReferenceAreaPathUseCase: CreateReferenceAreaPathUseCase;

  constructor() {
    this.createLinePathUseCase = new CreateLinePathUseCase();
    this.createReferenceAreaPathUseCase = new CreateReferenceAreaPathUseCase();
  }

  execute(
    data: DataPoint[],
    labKey: string,
    chartDimensions: ChartDimensions,
    getReferenceRangeUseCase: GetReferenceRangeUseCase
  ): MiniChartData | null {
    if (data.length < 1) return null;

    const timestamps = data.map((d) => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = data.length > 1 ? Math.max(...timestamps) : minTime + 1;

    const referenceRangesByDate: DynamicReferenceRangePoint[] = [];
    const yearSpan = maxTime - minTime;
    const numberOfYearPoints =
      data.length > 1
        ? Math.max(5, Math.ceil(yearSpan / (365 * 24 * 60 * 60 * 1000)))
        : 2;

    for (let i = 0; i < numberOfYearPoints; i++) {
      const ratio = numberOfYearPoints > 1 ? i / (numberOfYearPoints - 1) : 0;
      const timestamp = minTime + ratio * yearSpan;
      const currentDate = new Date(timestamp);
      const refRange = getReferenceRangeUseCase.execute(labKey, currentDate);
      referenceRangesByDate.push({
        timestamp,
        min: refRange.min,
        max: refRange.max,
      });
    }

    const values = data.map((d) => d.value ?? 0);
    const refMinValues = referenceRangesByDate.map((r) => r.min);
    const refMaxValues = referenceRangesByDate.map((r) => r.max);

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const rangeMin = Math.min(...refMinValues);
    const rangeMax = Math.max(...refMaxValues);

    const minValue = Math.min(dataMin, rangeMin) * 0.9;
    const maxValue = Math.max(dataMax, rangeMax) * 1.1;

    const linePath = this.createLinePathUseCase.execute(
      data,
      minTime,
      maxTime,
      minValue,
      maxValue,
      chartDimensions,
      0.2
    );

    const referenceAreaPaths = this.createReferenceAreaPathUseCase.execute(
      referenceRangesByDate,
      minTime,
      maxTime,
      minValue,
      maxValue,
      chartDimensions
    );

    return { linePath, referenceAreaPaths };
  }
}
