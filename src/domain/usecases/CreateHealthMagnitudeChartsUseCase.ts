import {
  CreateLinePathUseCase,
  DataPoint,
  ChartDimensions,
} from "./CreateLinePathUseCase";
import {
  CreateHealthZonePathUseCase,
  HealthZone,
} from "./CreateHealthZonePathUseCase";

export interface HealthMagnitudeDataPoint {
  date: Date;
  magnitude: number;
}

export interface HealthMagnitudeChartData {
  linePath: string;
  minTime: number;
  maxTime: number;
  minValue: number;
  maxValue: number;
  healthZonePath: string;
  verticalGridLines: VerticalGridLine[];
  horizontalGridLines: HorizontalGridLine[];
}

export interface VerticalGridLine {
  x: number;
  y1: number;
  y2: number;
  label: string;
  labelX: number;
  labelY: number;
}

export interface HorizontalGridLine {
  x1: number;
  x2: number;
  y: number;
  label: string;
  labelX: number;
  labelY: number;
}

export class CreateHealthMagnitudeChartsUseCase {
  private createLinePathUseCase: CreateLinePathUseCase;
  private createHealthZonePathUseCase: CreateHealthZonePathUseCase;

  constructor() {
    this.createLinePathUseCase = new CreateLinePathUseCase();
    this.createHealthZonePathUseCase = new CreateHealthZonePathUseCase();
  }

  execute(
    data: HealthMagnitudeDataPoint[],
    chartDimensions: ChartDimensions
  ): HealthMagnitudeChartData | null {
    if (data.length < 2) return null;

    const timestamps = data.map((d) => d.date.getTime());
    const magnitudes = data.map((d) => d.magnitude);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const healthZone: HealthZone = { min: 0, max: 0.5 };

    const minMagnitude = Math.min(...magnitudes);
    const maxMagnitude = Math.max(...magnitudes);

    const overallMin = Math.min(minMagnitude, healthZone.min);
    const overallMax = Math.max(maxMagnitude, healthZone.max);

    const range = overallMax - overallMin;
    let minValue, maxValue;

    if (range === 0) {
      minValue = 0;
      maxValue = overallMax + 0.5;
    } else {
      minValue = 0;
      maxValue = overallMax + range * 0.05;
    }

    const dataPoints: DataPoint[] = data.map((point) => ({
      timestamp: point.date.getTime(),
      value: point.magnitude,
    }));

    const linePath = this.createLinePathUseCase.execute(
      dataPoints,
      minTime,
      maxTime,
      minValue,
      maxValue,
      chartDimensions,
      0.2
    );

    const healthZonePath = this.createHealthZonePathUseCase.execute(
      healthZone,
      minValue,
      maxValue,
      chartDimensions
    );

    const verticalGridLines = this.createVerticalGridLines(
      data,
      minTime,
      maxTime,
      chartDimensions
    );

    const horizontalGridLines = this.createHorizontalGridLines(
      minValue,
      maxValue,
      chartDimensions
    );

    return {
      linePath,
      minTime,
      maxTime,
      minValue,
      maxValue,
      healthZonePath,
      verticalGridLines,
      horizontalGridLines,
    };
  }

  private formatDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;
  }

  private createVerticalGridLines(
    data: HealthMagnitudeDataPoint[],
    minTime: number,
    maxTime: number,
    chartDimensions: ChartDimensions
  ): VerticalGridLine[] {
    const {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = chartDimensions;
    const graphWidth = width - paddingLeft - paddingRight;

    const pointsToShow =
      data.length <= 6
        ? data
        : [
            data[0],
            ...data.filter(
              (_, i) =>
                i > 0 &&
                i < data.length - 1 &&
                i % Math.ceil(data.length / 5) === 0
            ),
            data[data.length - 1],
          ];

    return pointsToShow.map((point) => {
      const timeRange = maxTime - minTime;
      const x =
        paddingLeft +
        ((point.date.getTime() - minTime) / timeRange) * graphWidth;

      return {
        x,
        y1: paddingTop,
        y2: height - paddingBottom,
        label: this.formatDate(point.date),
        labelX: x,
        labelY: height - paddingBottom + 20,
      };
    });
  }

  private createHorizontalGridLines(
    minValue: number,
    maxValue: number,
    chartDimensions: ChartDimensions
  ): HorizontalGridLine[] {
    const {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = chartDimensions;
    const graphHeight = height - paddingTop - paddingBottom;

    const valueRange = maxValue - minValue;
    const step = valueRange / 4;

    return Array.from({ length: 5 }).map((_, index) => {
      const value = minValue + step * index;
      const y = height - paddingBottom - (index * graphHeight) / 4;

      return {
        x1: paddingLeft,
        x2: width - paddingRight,
        y,
        label: value.toFixed(2),
        labelX: paddingLeft - 5,
        labelY: y + 3,
      };
    });
  }
}
