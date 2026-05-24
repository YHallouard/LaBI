import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { DataPoint } from "../../domain/usecases/GetAnalysesUseCase";
import { GetReferenceRangeUseCase } from "../../domain/usecases/GetReferenceRangeUseCase";
import { CreateMiniChartsUseCase } from "../../domain/usecases/CreateMiniChartsUseCase";
import { ChartDimensions } from "../../domain/usecases/CreateLinePathUseCase";
import { theme } from "../../config/themes";

interface MiniChartProps {
  labKey: string;
  data: DataPoint[];
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
}

const MiniChart: React.FC<MiniChartProps> = ({
  labKey,
  data,
  getReferenceRangeUseCase,
}) => {
  const createMiniChartsUseCase = useMemo(
    () => new CreateMiniChartsUseCase(),
    []
  );

  const chartDimensions: ChartDimensions = {
    width: 120,
    height: 60,
    paddingTop: 5,
    paddingRight: 2,
    paddingBottom: 5,
    paddingLeft: 2,
  };

  const chartData = useMemo(() => {
    return createMiniChartsUseCase.execute(
      data,
      labKey,
      chartDimensions,
      getReferenceRangeUseCase
    );
  }, [data, labKey, getReferenceRangeUseCase, createMiniChartsUseCase]);

  if (!chartData) {
    return <View style={[styles.container, styles.placeholder]} />;
  }

  return (
    <View style={styles.container}>
      <Svg width={chartDimensions.width} height={chartDimensions.height}>
        <Defs>
          <SvgLinearGradient
            id={`referenceGradient-${labKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <Stop
              offset="0"
              stopColor={theme.chart.referenceArea.gradient.start.color}
              stopOpacity={0.4}
            />
            <Stop
              offset="1"
              stopColor={theme.chart.referenceArea.gradient.end.color}
              stopOpacity={0.1}
            />
          </SvgLinearGradient>
        </Defs>
        {chartData.referenceAreaPaths.map((path, index) => (
          <Path
            key={`ref-area-${index}`}
            d={path}
            fill={`url(#referenceGradient-${labKey})`}
          />
        ))}
        <Path
          d={chartData.linePath}
          fill="none"
          stroke={theme.chart.line.color}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
});

export default MiniChart;
