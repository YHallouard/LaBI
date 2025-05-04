import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import Svg, {
  Line,
  Circle,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import {
  GetAnalysesUseCase,
  GetLabTestDataUseCase,
  DataPoint,
} from "../../application/usecases/GetAnalysesUseCase";
import { CalculateStatisticsUseCase } from "../../application/usecases/CalculateStatisticsUseCase";
import {
  LAB_VALUE_KEYS,
  LAB_VALUE_UNITS,
  LAB_VALUE_REFERENCE_RANGES,
} from "../../config/LabConfig";
import { ScreenLayout } from "../components/ScreenLayout";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "../components/EmptyState";
import { StackNavigationProp } from "@react-navigation/stack";
import { ChartStackParamList } from "../../types/navigation";

type ChartScreenProps = {
  getAnalysesUseCase: GetAnalysesUseCase;
  getLabTestDataUseCase: GetLabTestDataUseCase;
  calculateStatisticsUseCase: CalculateStatisticsUseCase;
  navigation: StackNavigationProp<ChartStackParamList, "ChartScreen">;
};

type ChartDimensions = {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
};

type TimeRangeOption = "1y" | "3y" | "5y" | "Max";

export const ChartScreen: React.FC<ChartScreenProps> = ({
  getAnalysesUseCase,
  getLabTestDataUseCase,
  calculateStatisticsUseCase,
  navigation,
}) => {
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRangeOption>("3y");
  const [isTimeRangeMenuOpen, setIsTimeRangeMenuOpen] =
    useState<boolean>(false);

  // Animation values for each menu item
  const animations = {
    rotation: useState(new Animated.Value(0))[0],
    menuItem1: useState(new Animated.Value(0))[0],
    menuItem2: useState(new Animated.Value(0))[0],
    menuItem3: useState(new Animated.Value(0))[0],
    menuItem4: useState(new Animated.Value(0))[0],
  };

  const screenWidth = Dimensions.get("window").width;
  const chartDimensions: ChartDimensions = {
    width: screenWidth - 40,
    height: 200,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 40,
    paddingLeft: 40,
  };

  // Debug props on mount
  useEffect(() => {
    console.log("ChartScreen mounted with props:", {
      hasGetAnalysesUseCase: !!getAnalysesUseCase,
      hasGetLabTestDataUseCase: !!getLabTestDataUseCase,
      hasCalculateStatisticsUseCase: !!calculateStatisticsUseCase,
    });
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAnalyses();
    }, [])
  );

  const toggleTimeRangeMenu = (): void => {
    const toValue = isTimeRangeMenuOpen ? 0 : 1;

    // Rotate the main button
    Animated.timing(animations.rotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Fan out the menu items
    Animated.stagger(50, [
      Animated.spring(animations.menuItem1, {
        toValue,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(animations.menuItem2, {
        toValue,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(animations.menuItem3, {
        toValue,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(animations.menuItem4, {
        toValue,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    setIsTimeRangeMenuOpen(!isTimeRangeMenuOpen);
  };

  const selectTimeRange = (range: TimeRangeOption): void => {
    setSelectedTimeRange(range);
    toggleTimeRangeMenu();
  };

  const loadAnalyses = async (isRefresh: boolean = false): Promise<void> => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const result = await getAnalysesUseCase.execute();
      // Sort by date, oldest first for charts
      const sortedAnalyses = [...result].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      setAnalyses(sortedAnalyses);
      setError(null);
    } catch (err) {
      setError("Failed to load analyses");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyses(true);
  };

  // Maps data for a specific lab test
  const getLabTestData = (labKey: string): DataPoint[] => {
    if (!getLabTestDataUseCase) {
      console.error(
        "GetLabTestDataUseCase is undefined, using fallback implementation"
      );
      // Fallback implementation similar to the original function
      return analyses
        .map((analysis) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const labData = (analysis as any)[labKey];
          const hasValidValue =
            labData &&
            typeof labData.value === "number" &&
            !Number.isNaN(labData.value);

          return {
            date: new Date(analysis.date),
            value: hasValidValue ? labData.value : 0, // Default to 0 if value is invalid
            timestamp: new Date(analysis.date).getTime(),
          };
        })
        .filter((point) => point.value !== null && point.value !== 0);
    }
    return getLabTestDataUseCase.execute(analyses, labKey);
  };

  const getFilteredDataByTimeRange = (data: DataPoint[]): DataPoint[] => {
    if (selectedTimeRange === "Max" || data.length === 0) {
      return data;
    }

    const currentDate = new Date();
    const yearsToSubtract =
      selectedTimeRange === "1y" ? 1 : selectedTimeRange === "3y" ? 3 : 5;

    const cutoffDate = new Date();
    cutoffDate.setFullYear(currentDate.getFullYear() - yearsToSubtract);
    const cutoffTimestamp = cutoffDate.getTime();

    return data.filter((point) => point.timestamp >= cutoffTimestamp);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;
  };

  // Creates SVG path for a line chart with smoothed polynomial interpolation
  const createLinePath = (
    dataPoints: DataPoint[],
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions
  ): string => {
    if (dataPoints.length === 0) return "";
    if (dataPoints.length === 1) {
      const {
        width,
        height,
        paddingLeft,
        paddingTop,
        paddingBottom,
        paddingRight,
      } = dimensions;
      const point = dataPoints[0];
      const timeRange = maxTime - minTime;
      const x =
        paddingLeft +
        ((point.timestamp - minTime) / timeRange) *
          (width - paddingLeft - paddingRight);
      const valueRange = maxValue - minValue;
      const y =
        height -
        paddingBottom -
        (((point.value ?? 0) - minValue) / valueRange) *
          (height - paddingTop - paddingBottom);
      return `M ${x} ${y}`;
    }

    const {
      width,
      height,
      paddingLeft,
      paddingTop,
      paddingBottom,
      paddingRight,
    } = dimensions;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Calculate coordinates for each data point
    const points = dataPoints.map((point) => {
      const timeRange = maxTime - minTime;
      const x =
        paddingLeft + ((point.timestamp - minTime) / timeRange) * graphWidth;
      const valueRange = maxValue - minValue;
      const y =
        height -
        paddingBottom -
        (((point.value ?? 0) - minValue) / valueRange) * graphHeight;
      return { x, y, timestamp: point.timestamp };
    });

    // If we have just 2 points, create a simple quadratic Bézier curve
    if (points.length === 2) {
      const mx = (points[0].x + points[1].x) / 2;
      const my = (points[0].y + points[1].y) / 2;
      return `M ${points[0].x} ${points[0].y} Q ${mx} ${my}, ${points[1].x} ${points[1].y}`;
    }

    // First point
    let path = `M ${points[0].x} ${points[0].y}`;

    // Use a modified Catmull-Rom spline approach (smoother than polynomial interpolation)
    // with tension control to make it even smoother
    const tension = 0.33; // Lower values make the curve smoother (range: 0 to 1)
    const numIntermediatePoints = 12; // More points = smoother curve

    // For each segment between points
    for (let i = 0; i < points.length - 1; i++) {
      // Get four points for calculating the curve segment (p0, p1, p2, p3)
      const p0 = i === 0 ? points[0] : points[i - 1]; // If first point, duplicate it
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2]; // If last point, duplicate it

      // Generate intermediate points along the curve
      for (let t = 1; t <= numIntermediatePoints; t++) {
        const t1 = t / (numIntermediatePoints + 1);

        // Cardinal spline with tension control
        // Catmull-Rom is a special case of Cardinal spline with tension = 0.5
        // Applying a modified approach with custom tension for smoother results

        // Calculate control points with tension parameter
        const t2 = t1 * t1;
        const t3 = t2 * t1;

        // Cardinal spline basis functions with tension parameter
        const h1 = 2 * t3 - 3 * t2 + 1; // Hermite basis function for p1
        const h2 = -2 * t3 + 3 * t2; // Hermite basis function for p2
        const h3 = t3 - 2 * t2 + t1; // Hermite basis function for tangent at p1
        const h4 = t3 - t2; // Hermite basis function for tangent at p2

        // Tangent vectors scaled by tension
        const tx1 = tension * (p2.x - p0.x);
        const ty1 = tension * (p2.y - p0.y);
        const tx2 = tension * (p3.x - p1.x);
        const ty2 = tension * (p3.y - p1.y);

        // Calculate position at parameter t
        const x = h1 * p1.x + h2 * p2.x + h3 * tx1 + h4 * tx2;
        const y = h1 * p1.y + h2 * p2.y + h3 * ty1 + h4 * ty2;

        // Add point to path
        path += ` L ${x} ${y}`;
      }
    }

    // Add the last point
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

    return path;
  };

  // Creates SVG path for the area between min and max reference values
  const createReferenceAreaPath = (
    minTime: number,
    maxTime: number,
    minRefValue: number,
    maxRefValue: number,
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions
  ): string => {
    const {
      width,
      height,
      paddingLeft,
      paddingTop,
      paddingBottom,
      paddingRight,
    } = dimensions;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    const valueRange = maxValue - minValue;

    // Calculate y coordinates for min and max reference values
    const minRefY =
      height -
      paddingBottom -
      ((minRefValue - minValue) / valueRange) * graphHeight;
    const maxRefY =
      height -
      paddingBottom -
      ((maxRefValue - minValue) / valueRange) * graphHeight;

    // Create path: start at bottom-left of the reference area, go to top-left,
    // then to top-right, then to bottom-right, and close the path
    return `
      M ${paddingLeft} ${minRefY}
      L ${paddingLeft} ${maxRefY}
      L ${paddingLeft + graphWidth} ${maxRefY}
      L ${paddingLeft + graphWidth} ${minRefY}
      Z
    `;
  };

  // Create vertical grid lines based on dates
  const createVerticalGridLines = (
    dataPoints: DataPoint[],
    minTime: number,
    maxTime: number,
    dimensions: ChartDimensions
  ) => {
    const {
      width,
      height,
      paddingLeft,
      paddingTop,
      paddingBottom,
      paddingRight,
    } = dimensions;
    const graphWidth = width - paddingLeft - paddingRight;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const graphHeight = height - paddingTop - paddingBottom;

    const pointsToShow =
      dataPoints.length <= 6
        ? dataPoints
        : [
            dataPoints[0],
            ...dataPoints.filter(
              (_, i) =>
                i > 0 &&
                i < dataPoints.length - 1 &&
                i % Math.ceil(dataPoints.length / 5) === 0
            ),
            dataPoints[dataPoints.length - 1],
          ];

    return pointsToShow.map((point, index) => {
      const timeRange = maxTime - minTime;
      const x =
        paddingLeft + ((point.timestamp - minTime) / timeRange) * graphWidth;

      return (
        <React.Fragment key={`grid-${index}`}>
          <Line
            x1={x}
            y1={paddingTop}
            x2={x}
            y2={height - paddingBottom}
            stroke="#ECECEC"
            strokeWidth={1}
          />
          <SvgText
            x={x}
            y={height - paddingBottom + 20}
            fill="#95aac9"
            fontSize="9"
            textAnchor="middle"
            transform={`rotate(-45, ${x}, ${height - paddingBottom + 20})`}
          >
            {formatDate(point.date)}
          </SvgText>
        </React.Fragment>
      );
    });
  };

  // Create horizontal grid lines and value labels
  const createHorizontalGridLines = (
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions,
    unit: string
  ) => {
    const {
      width,
      height,
      paddingLeft,
      paddingTop,
      paddingBottom,
      paddingRight,
    } = dimensions;
    const graphHeight = height - paddingTop - paddingBottom;

    // Create about 5 horizontal lines
    const valueRange = maxValue - minValue;
    const step = valueRange / 4;

    return Array.from({ length: 5 }).map((_, index) => {
      const value = minValue + step * index;
      const y = height - paddingBottom - (index * graphHeight) / 4;

      return (
        <React.Fragment key={`h-grid-${index}`}>
          <Line
            x1={paddingLeft}
            y1={y}
            x2={width - paddingRight}
            y2={y}
            stroke="#ECECEC"
            strokeWidth={1}
          />
          <SvgText
            x={paddingLeft - 5}
            y={y + 3}
            fill="#95aac9"
            fontSize="9"
            textAnchor="middle"
          >
            {`${value.toFixed(1)} ${unit}`}
          </SvgText>
        </React.Fragment>
      );
    });
  };

  // Create data point circles
  const createDataPoints = (
    dataPoints: DataPoint[],
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    dimensions: ChartDimensions,
    refRange: { min: number; max: number }
  ) => {
    const {
      width,
      height,
      paddingLeft,
      paddingTop,
      paddingBottom,
      paddingRight,
    } = dimensions;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    return dataPoints.map((point, index) => {
      const timeRange = maxTime - minTime;
      const x =
        paddingLeft + ((point.timestamp - minTime) / timeRange) * graphWidth;

      const valueRange = maxValue - minValue;
      const y =
        height -
        paddingBottom -
        (((point.value ?? 0) - minValue) / valueRange) * graphHeight;

      // Determine if the point is outside the reference range
      const isOutsideRange =
        (point.value ?? 0) < refRange.min || (point.value ?? 0) > refRange.max;

      return (
        <Circle
          key={`point-${index}`}
          cx={x}
          cy={y}
          r={4}
          fill={isOutsideRange ? "#e63757" : "#4484B2"}
          stroke="white"
          strokeWidth={1}
        />
      );
    });
  };

  if (loading && !refreshing) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2c7be5" />
        </View>
      </ScreenLayout>
    );
  }

  if (error && !refreshing) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (analyses.length < 2 && !refreshing) {
    return (
      <ScreenLayout>
        <EmptyState
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation={navigation as any}
          message="Insufficient Data"
          subMessage="Upload at least 2 reports to see a chart"
          iconName="stats-chart-outline"
        />
      </ScreenLayout>
    );
  }

  // Calculate rotation interpolation for the main button
  const rotate = animations.rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <>
      <ScreenLayout
        scrollable={true}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <View style={styles.chartsContainer}>
          {LAB_VALUE_KEYS.map((labKey) => {
            const allData = getLabTestData(labKey);
            const data = getFilteredDataByTimeRange(allData);

            // Skip if no data or not enough data points for a meaningful graph
            if (data.length < 2) return null;

            const unit = LAB_VALUE_UNITS[labKey] || "";
            const refRange = LAB_VALUE_REFERENCE_RANGES[labKey] || {
              min: 0,
              max: 0,
            };

            // Calculate time range (x-axis)
            const timestamps = data.map((d) => d.timestamp);
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);

            // Calculate value range (y-axis) with padding
            const values = data.map((d) => d.value ?? 0);
            const dataMin = Math.min(...values);
            const dataMax = Math.max(...values);

            // Ensure min/max include reference ranges
            const minValue = Math.min(dataMin, refRange.min) * 0.95;
            const maxValue = Math.max(dataMax, refRange.max) * 1.05;

            // Calculate statistics
            const { latestValue, averageValue, maxPointValue } =
              calculateStatisticsUseCase.execute(data, refRange);

            // Create paths
            const linePath = createLinePath(
              data,
              minTime,
              maxTime,
              minValue,
              maxValue,
              chartDimensions
            );
            const referenceAreaPath = createReferenceAreaPath(
              minTime,
              maxTime,
              refRange.min,
              refRange.max,
              minValue,
              maxValue,
              chartDimensions
            );

            return (
              <View key={labKey} style={styles.chartSection}>
                <Text style={styles.chartTitle}>{labKey}</Text>

                <View style={styles.chartContainer}>
                  <Svg
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                  >
                    {/* Define gradient for reference area */}
                    <Defs>
                      <LinearGradient
                        id="referenceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop
                          offset="0"
                          stopColor="#00c800"
                          stopOpacity="0.2"
                        />
                        <Stop
                          offset="1"
                          stopColor="#00c800"
                          stopOpacity="0.05"
                        />
                      </LinearGradient>
                    </Defs>

                    {/* Reference range area */}
                    <Path
                      d={referenceAreaPath}
                      fill="url(#referenceGradient)"
                      stroke="#00c800"
                      strokeWidth={1}
                      opacity={0.5}
                    />

                    {/* Grid lines */}
                    {createVerticalGridLines(
                      data,
                      minTime,
                      maxTime,
                      chartDimensions
                    )}
                    {createHorizontalGridLines(
                      minValue,
                      maxValue,
                      chartDimensions,
                      unit
                    )}

                    {/* Line chart */}
                    <Path
                      d={linePath}
                      fill="none"
                      stroke="#4484B2"
                      strokeWidth={3}
                    />

                    {/* Data points */}
                    {createDataPoints(
                      data,
                      minTime,
                      maxTime,
                      minValue,
                      maxValue,
                      chartDimensions,
                      refRange
                    )}
                  </Svg>

                  {/* Chart legend */}
                  <View style={styles.referenceLegend}>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#4484B2" },
                          ]}
                        />
                        <Text style={styles.legendText}>Measured Value</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#00c800" },
                          ]}
                        />
                        <Text style={styles.legendText}>Normal Range</Text>
                      </View>
                    </View>
                    <Text style={styles.rangeText}>
                      Normal range: {refRange.min} - {refRange.max} {unit}
                    </Text>
                  </View>
                </View>

                {/* Statistics cards */}
                <View style={styles.statsContainer}>
                  <View
                    style={[
                      styles.statCard,
                      latestValue < refRange.min || latestValue > refRange.max
                        ? styles.statCardAlert
                        : {},
                    ]}
                  >
                    <Text style={styles.statLabel}>Latest</Text>
                    <Text
                      style={[
                        styles.statValue,
                        latestValue < refRange.min || latestValue > refRange.max
                          ? styles.statValueAlert
                          : {},
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {latestValue.toFixed(1)} {unit}
                    </Text>
                    <Text style={styles.statDate}>
                      {data.length > 0
                        ? formatDate(data[data.length - 1].date)
                        : ""}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statCard,
                      averageValue < refRange.min || averageValue > refRange.max
                        ? styles.statCardAlert
                        : {},
                    ]}
                  >
                    <Text style={styles.statLabel}>Average</Text>
                    <Text
                      style={[
                        styles.statValue,
                        averageValue < refRange.min ||
                        averageValue > refRange.max
                          ? styles.statValueAlert
                          : {},
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {averageValue.toFixed(1)} {unit}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statCard,
                      maxPointValue < refRange.min ||
                      maxPointValue > refRange.max
                        ? styles.statCardAlert
                        : {},
                    ]}
                  >
                    <Text style={styles.statLabel}>Max</Text>
                    <Text
                      style={[
                        styles.statValue,
                        maxPointValue < refRange.min ||
                        maxPointValue > refRange.max
                          ? styles.statValueAlert
                          : {},
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {maxPointValue.toFixed(1)} {unit}
                    </Text>
                    <Text style={styles.statDate}>
                      {data.length > 0
                        ? formatDate(data[values.indexOf(maxPointValue)].date)
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScreenLayout>

      {/* Floating Action Button and Time Range Menu - now outside ScreenLayout */}
      <View style={styles.fabContainer}>
        {/* Menu Items */}
        {/* Max button */}
        {/* 1 year button - closest to main button */}
        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateX: animations.menuItem4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0],
                  }),
                },
                {
                  translateY: animations.menuItem4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                  }),
                },
                {
                  scale: animations.menuItem4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
              opacity: animations.menuItem4.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fabMenuButton,
              selectedTimeRange === "1y" && styles.fabMenuButtonActive,
            ]}
            onPress={() => selectTimeRange("1y")}
          >
            <Text
              style={[
                styles.fabMenuButtonText,
                selectedTimeRange === "1y" && styles.fabMenuButtonTextActive,
              ]}
            >
              1y
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 3 years button - second position */}
        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateX: animations.menuItem3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0],
                  }),
                },
                {
                  translateY: animations.menuItem3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -120],
                  }),
                },
                {
                  scale: animations.menuItem3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
              opacity: animations.menuItem3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fabMenuButton,
              selectedTimeRange === "3y" && styles.fabMenuButtonActive,
            ]}
            onPress={() => selectTimeRange("3y")}
          >
            <Text
              style={[
                styles.fabMenuButtonText,
                selectedTimeRange === "3y" && styles.fabMenuButtonTextActive,
              ]}
            >
              3y
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 5 years button - third position */}
        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateX: animations.menuItem2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0],
                  }),
                },
                {
                  translateY: animations.menuItem2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -180],
                  }),
                },
                {
                  scale: animations.menuItem2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
              opacity: animations.menuItem2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fabMenuButton,
              selectedTimeRange === "5y" && styles.fabMenuButtonActive,
            ]}
            onPress={() => selectTimeRange("5y")}
          >
            <Text
              style={[
                styles.fabMenuButtonText,
                selectedTimeRange === "5y" && styles.fabMenuButtonTextActive,
              ]}
            >
              5y
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Max button - furthest up */}
        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateX: animations.menuItem1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0],
                  }),
                },
                {
                  translateY: animations.menuItem1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -240],
                  }),
                },
                {
                  scale: animations.menuItem1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
              opacity: animations.menuItem1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fabMenuButton,
              selectedTimeRange === "Max" && styles.fabMenuButtonActive,
            ]}
            onPress={() => selectTimeRange("Max")}
          >
            <Text
              style={[
                styles.fabMenuButtonText,
                selectedTimeRange === "Max" && styles.fabMenuButtonTextActive,
              ]}
            >
              Max
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB button */}
        <TouchableOpacity style={styles.fab} onPress={toggleTimeRangeMenu}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="time-outline" size={24} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  chartsContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 80, // Add space for the FAB
  },
  timeRangeIndicator: {
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: "rgba(241, 244, 248, 0.7)",
    borderRadius: 20,
  },
  timeRangeLabel: {
    fontSize: 14,
    color: "#12263f",
  },
  timeRangeValue: {
    fontWeight: "bold",
    color: "#2c7be5",
  },
  chartSection: {
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#12263f",
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  referenceLegend: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f4f8",
    flexDirection: "column",
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#95aac9",
  },
  rangeText: {
    fontSize: 12,
    color: "#12263f",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardAlert: {
    backgroundColor: "rgba(230, 55, 87, 0.1)",
  },
  statLabel: {
    fontSize: 12,
    color: "#95aac9",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c7be5",
  },
  statValueAlert: {
    color: "#e63757",
  },
  statDate: {
    fontSize: 10,
    color: "#95aac9",
    marginTop: 2,
  },
  errorText: {
    fontSize: 18,
    color: "#e63757",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#12263f",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#95aac9",
    textAlign: "center",
    marginTop: 8,
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  fab: {
    backgroundColor: "#2c7be5",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  fabMenuItem: {
    position: "absolute",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9,
  },
  fabMenuButton: {
    backgroundColor: "white",
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 16,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  fabMenuButtonActive: {
    backgroundColor: "#2c7be5",
  },
  fabMenuButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2c7be5",
  },
  fabMenuButtonTextActive: {
    color: "white",
  },
});
