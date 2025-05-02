import { DataPoint } from './GetAnalysesUseCase';

export interface StatisticsResult {
  latestValue: number;
  averageValue: number;
  maxPointValue: number;
}

export class CalculateStatisticsUseCase {
  execute(data: DataPoint[], refRange: { min: number; max: number }): StatisticsResult {
    const latestValue = data.length > 0 ? data[data.length - 1].value ?? 0 : 0;
    const averageValue = data.length > 0 
      ? data.reduce((sum, point) => sum + (point.value ?? 0), 0) / data.length 
      : 0;
    const maxPointValue = data.length > 0 
      ? Math.max(...data.map(point => point.value ?? 0)) 
      : 0;

    return { latestValue, averageValue, maxPointValue };
  }
}
