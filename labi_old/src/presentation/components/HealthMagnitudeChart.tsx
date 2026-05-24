import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import {
  CreateHealthMagnitudeChartsUseCase,
  HealthMagnitudeDataPoint,
} from "../../domain/usecases/CreateHealthMagnitudeChartsUseCase";
import { ChartDimensions } from "../../domain/usecases/CreateLinePathUseCase";
import { colorPalette, theme } from "../../config/themes";

interface HealthMagnitudeChartProps {
  data: HealthMagnitudeDataPoint[];
  chartDimensions: ChartDimensions;
}

const HealthMagnitudeChart: React.FC<HealthMagnitudeChartProps> = ({
  data,
  chartDimensions,
}) => {
  const createHealthMagnitudeChartsUseCase = useMemo(
    () => new CreateHealthMagnitudeChartsUseCase(),
    []
  );

  const chartData = useMemo(() => {
    return createHealthMagnitudeChartsUseCase.execute(data, chartDimensions);
  }, [data, chartDimensions, createHealthMagnitudeChartsUseCase]);

  if (!chartData) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text>Not enough data to display chart.</Text>
      </View>
    );
  }

  const { linePath, healthZonePath, verticalGridLines, horizontalGridLines } =
    chartData;

  return (
    <View style={styles.container}>
      <Svg width={chartDimensions.width} height={chartDimensions.height}>
        <Defs>
          <SvgLinearGradient
            id="healthZoneGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <Stop offset="0" stopColor="#90ee90" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#90ee90" stopOpacity={0.05} />
          </SvgLinearGradient>
        </Defs>
        {healthZonePath && (
          <Path d={healthZonePath} fill="url(#healthZoneGradient)" />
        )}

        {verticalGridLines.map((gridLine, index) => (
          <React.Fragment key={`v-grid-${index}`}>
            <Line
              x1={gridLine.x}
              y1={gridLine.y1}
              x2={gridLine.x}
              y2={gridLine.y2}
              stroke={theme.chart.grid.line.color}
              strokeWidth={theme.chart.grid.line.width}
            />
            <SvgText
              x={gridLine.labelX}
              y={gridLine.labelY}
              fill={theme.chart.grid.text.color}
              fontSize={theme.chart.grid.text.fontSize}
              textAnchor="middle"
              transform={`rotate(-45, ${gridLine.labelX}, ${gridLine.labelY})`}
            >
              {gridLine.label}
            </SvgText>
          </React.Fragment>
        ))}

        {horizontalGridLines.map((gridLine, index) => (
          <React.Fragment key={`h-grid-${index}`}>
            <Line
              x1={gridLine.x1}
              y1={gridLine.y}
              x2={gridLine.x2}
              y2={gridLine.y}
              stroke={theme.chart.grid.line.color}
              strokeWidth={theme.chart.grid.line.width}
            />
            <SvgText
              x={gridLine.labelX}
              y={gridLine.labelY}
              fill={theme.chart.grid.text.color}
              fontSize={theme.chart.grid.text.fontSize}
              textAnchor="middle"
            >
              {gridLine.label}
            </SvgText>
          </React.Fragment>
        ))}

        <Path
          d={linePath}
          fill="none"
          stroke={colorPalette.primary.main}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 8,
  },
});

export default HealthMagnitudeChart;
