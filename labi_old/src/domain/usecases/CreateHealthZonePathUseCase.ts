import { ChartDimensions } from "./CreateLinePathUseCase";

export interface HealthZone {
  min: number;
  max: number;
}

export class CreateHealthZonePathUseCase {
  execute(
    healthZone: HealthZone,
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions
  ): string {
    const {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = dimensions;
    const graphHeight = height - paddingTop - paddingBottom;
    const valueRange = maxValue - minValue || 1;

    const zoneMin = Math.max(healthZone.min, minValue);
    const zoneMax = Math.min(healthZone.max, maxValue);

    if (zoneMin >= zoneMax) {
      return "";
    }

    const y1 =
      height -
      paddingBottom -
      ((zoneMax - minValue) / valueRange) * graphHeight;
    const y2 =
      height -
      paddingBottom -
      ((zoneMin - minValue) / valueRange) * graphHeight;

    const x1 = paddingLeft;
    const x2 = width - paddingRight;

    return `M ${x1},${y1} L ${x2},${y1} L ${x2},${y2} L ${x1},${y2} Z`;
  }
}
