import { ChartDimensions } from "./CreateLinePathUseCase";

export interface DynamicReferenceRangePoint {
  timestamp: number;
  min: number;
  max: number;
}

export class CreateReferenceAreaPathUseCase {
  execute(
    referenceRanges: DynamicReferenceRangePoint[],
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions
  ): string[] {
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
    const valueRange = maxValue - minValue;
    const timeRange = maxTime - minTime;

    const sortedRanges = [...referenceRanges].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const paths: string[] = [];

    if (sortedRanges.length >= 1) {
      let path = `M ${paddingLeft} ${
        height -
        paddingBottom -
        ((sortedRanges[0].max - minValue) / valueRange) * graphHeight
      }`;

      for (let i = 0; i < sortedRanges.length; i++) {
        const x =
          paddingLeft +
          ((sortedRanges[i].timestamp - minTime) / timeRange) * graphWidth;
        const maxY =
          height -
          paddingBottom -
          ((sortedRanges[i].max - minValue) / valueRange) * graphHeight;
        path += ` L ${x} ${maxY}`;
      }

      const lastRange = sortedRanges[sortedRanges.length - 1];
      path += ` L ${width - paddingRight} ${
        height -
        paddingBottom -
        ((lastRange.max - minValue) / valueRange) * graphHeight
      }`;
      path += ` L ${width - paddingRight} ${
        height -
        paddingBottom -
        ((lastRange.min - minValue) / valueRange) * graphHeight
      }`;

      for (let i = sortedRanges.length - 1; i >= 0; i--) {
        const x =
          paddingLeft +
          ((sortedRanges[i].timestamp - minTime) / timeRange) * graphWidth;
        const minY =
          height -
          paddingBottom -
          ((sortedRanges[i].min - minValue) / valueRange) * graphHeight;
        path += ` L ${x} ${minY}`;
      }

      path += ` Z`;
      paths.push(path);
    }

    return paths;
  }
}
