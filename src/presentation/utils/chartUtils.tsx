import * as React from "react";
import { Circle } from "react-native-svg";
import { theme } from "../../config/themes";
import { DataPoint } from "../../domain/usecases/GetAnalysesUseCase";

export type ChartDimensions = {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
};

export type DynamicReferenceRangePoint = {
  timestamp: number;
  min: number;
  max: number;
};

export function createLinePath(
  dataPoints: DataPoint[],
  minTime: number,
  maxTime: number,
  minValue: number,
  maxValue: number,
  dimensions: ChartDimensions
): string {
  if (dataPoints.length === 0) return "";

  if (dataPoints.length === 1) {
    const {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = dimensions;
    const point = dataPoints[0];
    const timeRange = maxTime - minTime || 1; // Prevent division by zero
    const x =
      paddingLeft +
      ((point.timestamp - minTime) / timeRange) *
        (width - paddingLeft - paddingRight);
    const valueRange = maxValue - minValue || 1; // Prevent division by zero
    const y =
      height -
      paddingBottom -
      (((point.value ?? 0) - minValue) / valueRange) *
        (height - paddingTop - paddingBottom);
    return `M ${x} ${y}`;
  }

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
    const timeRange = maxTime - minTime;
    const valueRange = maxValue - minValue;

    const x =
      paddingLeft + ((point.timestamp - minTime) / timeRange) * graphWidth;
    const y =
      height -
      paddingBottom -
      (((point.value ?? 0) - minValue) / valueRange) * graphHeight;

    return { x, y, timestamp: point.timestamp };
  });

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  return createCardinalSpline(points, 0.1);
}

function createCardinalSpline(
  points: { x: number; y: number }[],
  tension: number = 0.1
): string {
  if (points.length < 2) return "";

  const path: string[] = [`M ${points[0].x},${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    let cp1x, cp1y, cp2x, cp2y;

    if (i === 0) {
      cp1x = p0.x + (p1.x - p0.x) * tension;
      cp1y = p0.y + (p1.y - p0.y) * tension;
    } else {
      const prev = points[i - 1];
      cp1x = p0.x + (p1.x - prev.x) * tension;
      cp1y = p0.y + (p1.y - prev.y) * tension;
    }

    if (i === points.length - 2) {
      cp2x = p1.x - (p1.x - p0.x) * tension;
      cp2y = p1.y - (p1.y - p0.y) * tension;
    } else {
      const next = points[i + 2];
      cp2x = p1.x - (next.x - p0.x) * tension;
      cp2y = p1.y - (next.y - p0.y) * tension;
    }

    path.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`);
  }

  return path.join(" ");
}

export function createDynamicReferenceAreaPaths(
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

  if (sortedRanges.length >= 2) {
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

    path += ` L ${width - paddingRight} ${
      height -
      paddingBottom -
      ((sortedRanges[sortedRanges.length - 1].max - minValue) / valueRange) *
        graphHeight
    }`;

    path += ` L ${width - paddingRight} ${
      height -
      paddingBottom -
      ((sortedRanges[sortedRanges.length - 1].min - minValue) / valueRange) *
        graphHeight
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

export function createDataPoints(
  dataPoints: DataPoint[],
  minTime: number,
  maxTime: number,
  minValue: number,
  maxValue: number,
  dimensions: ChartDimensions,
  referenceRanges: DynamicReferenceRangePoint[]
): React.ReactElement[] {
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

  const sortedReferenceRanges = [...referenceRanges].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  return dataPoints.map((point, index) => {
    const timeRange = maxTime - minTime;
    const x =
      paddingLeft + ((point.timestamp - minTime) / timeRange) * graphWidth;

    const valueRange = maxValue - minValue;
    const y =
      height -
      paddingBottom -
      (((point.value ?? 0) - minValue) / valueRange) * graphHeight;

    const getReferenceRangeForTimestamp = (
      timestamp: number
    ): { min: number; max: number } => {
      if (timestamp <= sortedReferenceRanges[0].timestamp) {
        return {
          min: sortedReferenceRanges[0].min,
          max: sortedReferenceRanges[0].max,
        };
      }
      if (
        timestamp >=
        sortedReferenceRanges[sortedReferenceRanges.length - 1].timestamp
      ) {
        const lastRange =
          sortedReferenceRanges[sortedReferenceRanges.length - 1];
        return {
          min: lastRange.min,
          max: lastRange.max,
        };
      }
      for (let i = 0; i < sortedReferenceRanges.length - 1; i++) {
        const currentRange = sortedReferenceRanges[i];
        const nextRange = sortedReferenceRanges[i + 1];

        if (
          timestamp >= currentRange.timestamp &&
          timestamp <= nextRange.timestamp
        ) {
          const ratio =
            (timestamp - currentRange.timestamp) /
            (nextRange.timestamp - currentRange.timestamp);

          const min =
            currentRange.min + ratio * (nextRange.min - currentRange.min);
          const max =
            currentRange.max + ratio * (nextRange.max - currentRange.max);

          return { min, max };
        }
      }
      return {
        min: sortedReferenceRanges[0].min,
        max: sortedReferenceRanges[0].max,
      };
    };

    const refRange = getReferenceRangeForTimestamp(point.timestamp);
    const isOutsideRange =
      (point.value ?? 0) < refRange.min || (point.value ?? 0) > refRange.max;

    const pointStyle = isOutsideRange
      ? theme.chart.point.alert
      : theme.chart.point.normal;

    return React.createElement(Circle, {
      key: `point-${index}`,
      cx: x,
      cy: y,
      r: pointStyle.radius,
      fill: pointStyle.fill,
      stroke: pointStyle.stroke,
      strokeWidth: pointStyle.strokeWidth,
    });
  });
}
