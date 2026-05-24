import { CreateCardinalSplineUseCase } from "./CreateCardinalSplineUseCase";

export interface DataPoint {
  timestamp: number;
  value: number | null;
}

export interface ChartDimensions {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export class CreateLinePathUseCase {
  private createCardinalSplineUseCase: CreateCardinalSplineUseCase;

  constructor() {
    this.createCardinalSplineUseCase = new CreateCardinalSplineUseCase();
  }

  execute(
    dataPoints: DataPoint[],
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions,
    tension: number = 0.2
  ): string {
    if (dataPoints.length < 2) return "";

    const points = dataPoints.map((point) => {
      const {
        width,
        height,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
      } = dimensions;
      const graphWidth = width - paddingLeft - paddingRight;
      const graphHeight = height - paddingTop - paddingBottom;
      const timeRange = maxTime - minTime || 1;
      const valueRange = maxValue - minValue || 1;
      const x =
        paddingLeft + ((point.timestamp - minTime) / timeRange) * graphWidth;
      const y =
        height -
        paddingBottom -
        (((point.value ?? 0) - minValue) / valueRange) * graphHeight;
      return { x, y };
    });

    return this.createCardinalSplineUseCase.execute(points, tension);
  }
}
