import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  RefreshControl,
  SectionList,
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
import { LAB_VALUE_UNITS, LAB_VALUE_CATEGORIES } from "../../config/LabConfig";
import { ReferenceRangeService } from "../../application/services/ReferenceRangeService";
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
  referenceRangeService: ReferenceRangeService;
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

type ChartItemProps = {
  labKey: string;
  data: DataPoint[];
  unit: string;
  referenceRangeService: ReferenceRangeService;
  calculateStatisticsUseCase: CalculateStatisticsUseCase;
  chartDimensions: ChartDimensions;
  formatDate: (date: Date) => string;
};

type DynamicReferenceRangePoint = {
  timestamp: number;
  min: number;
  max: number;
};

type ChartData = {
  labKey: string;
  filteredData: DataPoint[];
  unit: string;
};

const ChartItem: React.FC<ChartItemProps> = ({
  labKey,
  data,
  unit,
  referenceRangeService,
  calculateStatisticsUseCase,
  chartDimensions,
  formatDate,
}) => {
  if (data.length < 2) return null;

  const generateChartDatapoints = () => {
    const timestamps = data.map((d) => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    return { minTime, maxTime };
  };

  const generateReferenceRanges = () => {
    const { minTime, maxTime } = generateChartDatapoints();

    // Get the latest data point to determine the user's current age
    const latestDate = new Date(Math.max(...data.map((d) => d.date.getTime())));

    // Create a list of intermediate points across the x-axis (yearly intervals)
    const referenceRangesByDate: DynamicReferenceRangePoint[] = [];

    // Calculate yearSpan in milliseconds
    const yearSpan = maxTime - minTime;
    const numberOfYearPoints = Math.max(
      5,
      Math.ceil(yearSpan / (365 * 24 * 60 * 60 * 1000))
    );

    // Create reference range points for each year in the time range
    for (let i = 0; i <= numberOfYearPoints; i++) {
      const timestamp = minTime + (i / numberOfYearPoints) * yearSpan;
      const currentDate = new Date(timestamp);

      // Get reference range based on the date (which determines the age)
      const refRange = referenceRangeService.getReferenceRange(
        labKey,
        currentDate
      );

      referenceRangesByDate.push({
        timestamp,
        min: refRange.min,
        max: refRange.max,
      });
    }

    // Get the latest reference range for statistics
    const latestRefRange = referenceRangeService.getReferenceRange(
      labKey,
      latestDate
    );

    return { referenceRangesByDate, latestRefRange };
  };

  const calculateValueRange = (
    referenceRangesByDate: DynamicReferenceRangePoint[]
  ) => {
    const values = data.map((d) => d.value ?? 0);
    const refMinValues = referenceRangesByDate.map(
      (r: DynamicReferenceRangePoint) => r.min
    );
    const refMaxValues = referenceRangesByDate.map(
      (r: DynamicReferenceRangePoint) => r.max
    );

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const rangeMin = Math.min(...refMinValues);
    const rangeMax = Math.max(...refMaxValues);

    const minValue = Math.min(dataMin, rangeMin) * 0.95;
    const maxValue = Math.max(dataMax, rangeMax) * 1.05;

    return { values, minValue, maxValue };
  };

  const { minTime, maxTime } = generateChartDatapoints();
  const { referenceRangesByDate, latestRefRange } = generateReferenceRanges();
  const { values, minValue, maxValue } = calculateValueRange(
    referenceRangesByDate
  );

  const { latestValue, averageValue, maxPointValue } =
    calculateStatisticsUseCase.execute(data, latestRefRange);

  const linePath = createLinePath(
    data,
    minTime,
    maxTime,
    minValue,
    maxValue,
    chartDimensions
  );

  const referenceAreaPaths = createDynamicReferenceAreaPaths(
    referenceRangesByDate,
    minTime,
    maxTime,
    minValue,
    maxValue,
    chartDimensions
  );

  const renderChartGradient = () => (
    <Defs>
      <LinearGradient
        id={`referenceGradient-${labKey}`}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <Stop offset="0" stopColor="#00c800" stopOpacity="0.2" />
        <Stop offset="1" stopColor="#00c800" stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
  );

  const renderReferenceAreaPaths = () =>
    referenceAreaPaths.map((path: string, index: number) => (
      <Path
        key={`ref-area-${index}`}
        d={path}
        fill={`url(#referenceGradient-${labKey})`}
        stroke="#00c800"
        strokeWidth={1}
        opacity={0.6}
      />
    ));

  const renderStatCard = (label: string, value: number, date?: Date) => {
    const isOutOfRange =
      value < latestRefRange.min || value > latestRefRange.max;

    return (
      <View style={[styles.statCard, isOutOfRange ? styles.statCardAlert : {}]}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text
          style={[styles.statValue, isOutOfRange ? styles.statValueAlert : {}]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {value.toFixed(1)} {unit}
        </Text>
        {date && <Text style={styles.statDate}>{formatDate(date)}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.chartSection}>
      <Text style={styles.chartTitle}>{labKey}</Text>

      <View style={styles.chartContainer}>
        <Svg width={chartDimensions.width} height={chartDimensions.height}>
          {renderChartGradient()}
          {renderReferenceAreaPaths()}

          {createVerticalGridLines(
            data,
            minTime,
            maxTime,
            chartDimensions,
            formatDate
          )}
          {createHorizontalGridLines(minValue, maxValue, chartDimensions, unit)}

          <Path d={linePath} fill="none" stroke="#4484B2" strokeWidth={3} />

          {createDataPoints(
            data,
            minTime,
            maxTime,
            minValue,
            maxValue,
            chartDimensions,
            referenceRangesByDate
          )}
        </Svg>

        <ChartLegend latestRefRange={latestRefRange} unit={unit} />
      </View>

      <View style={styles.statsContainer}>
        {renderStatCard("Latest", latestValue, data[data.length - 1].date)}
        {renderStatCard("Average", averageValue)}
        {renderStatCard(
          "Max",
          maxPointValue,
          data[values.indexOf(maxPointValue)].date
        )}
      </View>
    </View>
  );
};

const ChartLegend = ({
  latestRefRange,
  unit,
}: {
  latestRefRange: { min: number; max: number };
  unit: string;
}) => (
  <View style={styles.referenceLegend}>
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: "#4484B2" }]} />
        <Text style={styles.legendText}>Measured Value</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: "#00c800" }]} />
        <Text style={styles.legendText}>Normal Range</Text>
      </View>
    </View>
    <Text style={styles.rangeText}>
      Current normal range: {latestRefRange.min.toFixed(1)} -{" "}
      {latestRefRange.max.toFixed(1)} {unit}
    </Text>
  </View>
);

export const ChartScreen: React.FC<ChartScreenProps> = ({
  getAnalysesUseCase,
  getLabTestDataUseCase,
  calculateStatisticsUseCase,
  referenceRangeService,
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

  const animations = {
    rotation: useState(new Animated.Value(0))[0],
    menuItem1: useState(new Animated.Value(0))[0],
    menuItem2: useState(new Animated.Value(0))[0],
    menuItem3: useState(new Animated.Value(0))[0],
    menuItem4: useState(new Animated.Value(0))[0],
  };

  const screenWidth = Dimensions.get("window").width;
  const chartDimensions = useMemo<ChartDimensions>(
    () => ({
      width: screenWidth - 40,
      height: 200,
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 40,
      paddingLeft: 40,
    }),
    [screenWidth]
  );

  useEffect(() => {
    initializeAndLoadData();
  }, []);

  const initializeAndLoadData = async () => {
    try {
      await referenceRangeService.initialize();
      loadAnalyses();
    } catch {
      setError("Failed to initialize reference range service");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAnalyses();
    }, [])
  );

  const toggleTimeRangeMenu = (): void => {
    const toValue = isTimeRangeMenuOpen ? 0 : 1;
    rotateMenuButton(toValue);
    animateMenuItems(toValue);
    setIsTimeRangeMenuOpen(!isTimeRangeMenuOpen);
  };

  const rotateMenuButton = (toValue: number) => {
    Animated.timing(animations.rotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateMenuItems = (toValue: number) => {
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
  };

  const selectTimeRange = (range: TimeRangeOption): void => {
    // Close menu first with animations and update time range after animation completes
    const toValue = 0; // Force to 0 to close the menu

    // Animate menu closing
    Animated.parallel([
      Animated.timing(animations.rotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
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
      ]),
    ]).start(() => {
      // Update state after animation completes
      setIsTimeRangeMenuOpen(false);
      setSelectedTimeRange(range);
    });
  };

  const loadAnalyses = async (isRefresh: boolean = false): Promise<void> => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const result = await getAnalysesUseCase.execute();
      const sortedAnalyses = sortAnalysesByDate(result);
      setAnalyses(sortedAnalyses);
      setError(null);
    } catch {
      setError("Failed to load analyses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sortAnalysesByDate = (
    analyses: BiologicalAnalysis[]
  ): BiologicalAnalysis[] => {
    return [...analyses].sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadAnalyses(true);
  };

  const getLabTestData = useCallback(
    (labKey: string): DataPoint[] => {
      if (!getLabTestDataUseCase) {
        setError("GetLabTestDataUseCase is undefined");
        return getFallbackLabTestData(labKey);
      }
      return getLabTestDataUseCase.execute(analyses, labKey);
    },
    [analyses, getLabTestDataUseCase]
  );

  const getFallbackLabTestData = (labKey: string): DataPoint[] => {
    return analyses
      .map((analysis) => {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const labData = (analysis as any)[labKey];
        const hasValidValue =
          labData &&
          typeof labData.value === "number" &&
          !Number.isNaN(labData.value);

        return {
          date: new Date(analysis.date),
          value: hasValidValue ? labData.value : 0,
          timestamp: new Date(analysis.date).getTime(),
        };
      })
      .filter((point) => point.value !== null && point.value !== 0);
  };

  const getFilteredDataByTimeRange = useCallback(
    (data: DataPoint[]): DataPoint[] => {
      if (selectedTimeRange === "Max" || data.length === 0) {
        return data;
      }

      const cutoffTimestamp = calculateCutoffTimestamp(selectedTimeRange);
      return data.filter((point) => point.timestamp >= cutoffTimestamp);
    },
    [selectedTimeRange]
  );

  const calculateCutoffTimestamp = (timeRange: TimeRangeOption): number => {
    const currentDate = new Date();
    const yearsToSubtract = timeRange === "1y" ? 1 : timeRange === "3y" ? 3 : 5;

    const cutoffDate = new Date();
    cutoffDate.setFullYear(currentDate.getFullYear() - yearsToSubtract);
    return cutoffDate.getTime();
  };

  const formatDate = useCallback((date: Date): string => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;
  }, []);

  const chartDataByCategory = useMemo(() => {
    const categorizedData: Record<string, ChartData[]> = {};

    Object.entries(LAB_VALUE_CATEGORIES).forEach(([category, keys]) => {
      const categoryData = keys
        .map((labKey) => {
          const allData = getLabTestData(labKey);
          const filteredData = getFilteredDataByTimeRange(allData);
          const unit = LAB_VALUE_UNITS[labKey] || "";

          return {
            labKey,
            filteredData,
            unit,
          };
        })
        .filter((item) => item.filteredData.length >= 2);

      if (categoryData.length > 0) {
        categorizedData[category] = categoryData;
      }
    });

    return categorizedData;
  }, [analyses, selectedTimeRange, getLabTestData, getFilteredDataByTimeRange]);

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        <View style={styles.sectionHeaderLine} />
      </View>
    ),
    []
  );

  const renderSectionItem = useCallback(
    ({ item }: { item: ChartData }) => (
      <ChartItem
        labKey={item.labKey}
        data={item.filteredData}
        unit={item.unit}
        referenceRangeService={referenceRangeService}
        calculateStatisticsUseCase={calculateStatisticsUseCase}
        chartDimensions={chartDimensions}
        formatDate={formatDate}
      />
    ),
    [
      calculateStatisticsUseCase,
      chartDimensions,
      formatDate,
      referenceRangeService,
    ]
  );

  const sections = useMemo(
    () =>
      Object.entries(chartDataByCategory).map(([category, data]) => ({
        title: category,
        data,
      })),
    [chartDataByCategory]
  );

  const keyExtractor = useCallback((item: ChartData) => item.labKey, []);

  if (loading && !refreshing) {
    return renderLoadingScreen();
  }

  if (error && !refreshing) {
    return renderErrorScreen(error);
  }

  if (analyses.length < 2 && !refreshing) {
    return renderInsufficientDataScreen();
  }

  const timeRangeFloatingMenu = (
    <TimeRangeFloatingMenu
      selectedTimeRange={selectedTimeRange}
      animations={animations}
      onSelectTimeRange={selectTimeRange}
      onToggleMenu={toggleTimeRangeMenu}
    />
  );

  if (Object.keys(chartDataByCategory).length === 0) {
    return renderNoDataForTimeRangeScreen(
      selectedTimeRange,
      timeRangeFloatingMenu
    );
  }

  return renderChartScreen(
    sections,
    renderSectionHeader,
    renderSectionItem,
    keyExtractor,
    refreshing,
    onRefresh,
    timeRangeFloatingMenu
  );

  function renderLoadingScreen() {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2c7be5" />
        </View>
      </ScreenLayout>
    );
  }

  function renderErrorScreen(errorMessage: string) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </ScreenLayout>
    );
  }

  function renderInsufficientDataScreen() {
    return (
      <ScreenLayout>
        <EmptyState
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          navigation={navigation as any}
          message="Insufficient Data"
          subMessage="Upload at least 2 reports to see a chart"
          iconName="stats-chart-outline"
        />
      </ScreenLayout>
    );
  }

  function renderNoDataForTimeRangeScreen(
    selectedTimeRange: TimeRangeOption,
    timeRangeFloatingMenu: React.ReactNode
  ) {
    return (
      <>
        <ScreenLayout>
          <NoDataEmptyState selectedTimeRange={selectedTimeRange} />
        </ScreenLayout>
        {timeRangeFloatingMenu}
      </>
    );
  }

  function renderChartScreen(
    sections: { title: string; data: ChartData[] }[],
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    renderSectionHeader: any,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    renderSectionItem: any,
    keyExtractor: (item: ChartData) => string,
    refreshing: boolean,
    onRefresh: () => void,
    timeRangeFloatingMenu: React.ReactNode
  ) {
    return (
      <ScreenLayout>
        <SectionList
          sections={sections}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderSectionItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.chartsContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={6}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2c7be5"]}
              tintColor="#2c7be5"
              title="Pull to refresh..."
              titleColor="#95aac9"
            />
          }
        />
        {timeRangeFloatingMenu}
      </ScreenLayout>
    );
  }
};

type NoDataEmptyStateProps = {
  selectedTimeRange: TimeRangeOption;
};

const NoDataEmptyState: React.FC<NoDataEmptyStateProps> = ({
  selectedTimeRange,
}) => (
  <View style={styles.emptyStateContainer}>
    <View style={styles.emptyStateContent}>
      <View style={styles.emptyStateIconContainer}>
        <Ionicons name="time-outline" size={60} color="#ffffff" />
      </View>
      <Text style={styles.emptyStateTitle}>No Data Available</Text>
      <Text style={styles.emptyStateDescription}>
        There are no charts to display for the selected time period.
      </Text>
      <View style={styles.timeRangeInfo}>
        <Text style={styles.currentTimeRangeLabel}>
          Current time range:{" "}
          <Text style={styles.currentTimeRangeValue}>{selectedTimeRange}</Text>
        </Text>
      </View>
      <View style={styles.emptyStateActionContainer}>
        <Text style={styles.emptyStateActionLabel}>
          Try selecting a different time range.
        </Text>
      </View>
    </View>
  </View>
);

type TimeRangeButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  animation: Animated.Value;
  yOffset: number;
};

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({
  label,
  isActive,
  onPress,
  animation,
  yOffset,
}) => (
  <Animated.View
    style={[
      styles.fabMenuItem,
      {
        transform: [
          {
            translateX: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0],
            }),
          },
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, yOffset],
            }),
          },
          {
            scale: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          },
        ],
        opacity: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ]}
  >
    <TouchableOpacity
      style={[styles.fabMenuButton, isActive && styles.fabMenuButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.fabMenuButtonText,
          isActive && styles.fabMenuButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

type TimeRangeFloatingMenuProps = {
  selectedTimeRange: TimeRangeOption;
  animations: {
    rotation: Animated.Value;
    menuItem1: Animated.Value;
    menuItem2: Animated.Value;
    menuItem3: Animated.Value;
    menuItem4: Animated.Value;
  };
  onSelectTimeRange: (range: TimeRangeOption) => void;
  onToggleMenu: () => void;
};

const TimeRangeFloatingMenu: React.FC<TimeRangeFloatingMenuProps> = ({
  selectedTimeRange,
  animations,
  onSelectTimeRange,
  onToggleMenu,
}) => {
  const rotate = animations.rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View style={styles.fabContainer}>
      {renderTimeRangeButtons(selectedTimeRange, animations, onSelectTimeRange)}
      {renderMainButton(rotate, onToggleMenu)}
    </View>
  );
};

const renderTimeRangeButtons = (
  selectedTimeRange: TimeRangeOption,
  animations: {
    menuItem1: Animated.Value;
    menuItem2: Animated.Value;
    menuItem3: Animated.Value;
    menuItem4: Animated.Value;
  },
  onSelectTimeRange: (range: TimeRangeOption) => void
) => (
  <>
    <TimeRangeButton
      label="1y"
      isActive={selectedTimeRange === "1y"}
      onPress={() => onSelectTimeRange("1y")}
      animation={animations.menuItem4}
      yOffset={-60}
    />

    <TimeRangeButton
      label="3y"
      isActive={selectedTimeRange === "3y"}
      onPress={() => onSelectTimeRange("3y")}
      animation={animations.menuItem3}
      yOffset={-120}
    />

    <TimeRangeButton
      label="5y"
      isActive={selectedTimeRange === "5y"}
      onPress={() => onSelectTimeRange("5y")}
      animation={animations.menuItem2}
      yOffset={-180}
    />

    <TimeRangeButton
      label="Max"
      isActive={selectedTimeRange === "Max"}
      onPress={() => onSelectTimeRange("Max")}
      animation={animations.menuItem1}
      yOffset={-240}
    />
  </>
);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const renderMainButton = (rotate: any, onToggleMenu: () => void) => (
  <TouchableOpacity style={styles.fab} onPress={onToggleMenu}>
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="time-outline" size={24} color="white" />
    </Animated.View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  chartsContainer: {
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
    elevation: 1,
    borderWidth: 0,
    overflow: "hidden",
  },
  statCardAlert: {
    backgroundColor: "rgba(230, 55, 87, 0.1)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyStateIconContainer: {
    backgroundColor: "#2c7be5",
    borderRadius: 28,
    padding: 12,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#12263f",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#95aac9",
    textAlign: "center",
    marginBottom: 20,
  },
  timeRangeInfo: {
    marginBottom: 20,
  },
  currentTimeRangeLabel: {
    fontSize: 14,
    color: "#12263f",
  },
  currentTimeRangeValue: {
    fontWeight: "bold",
    color: "#2c7be5",
  },
  emptyStateActionContainer: {
    alignItems: "center",
    width: "100%",
  },
  emptyStateActionLabel: {
    fontSize: 14,
    color: "#95aac9",
    marginBottom: 12,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#12263f",
    textAlign: "center",
  },
  sectionHeaderContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#12263f",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionHeaderLine: {
    height: 3,
    width: 80,
    backgroundColor: "#2c7be5",
    borderRadius: 3,
  },
});

function createLinePath(
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

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
}

function createDynamicReferenceAreaPaths(
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

  // Ensure reference ranges are sorted by timestamp
  const sortedRanges = [...referenceRanges].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const paths: string[] = [];

  // Create a single continuous path for the entire reference area
  if (sortedRanges.length >= 2) {
    // Start with the top boundary from left to right
    let path = `M ${paddingLeft} ${
      height -
      paddingBottom -
      ((sortedRanges[0].max - minValue) / valueRange) * graphHeight
    }`;

    // Add points for the top boundary (max values)
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

    // Continue to the right edge at max level
    path += ` L ${width - paddingRight} ${
      height -
      paddingBottom -
      ((sortedRanges[sortedRanges.length - 1].max - minValue) / valueRange) *
        graphHeight
    }`;

    // Now go to the bottom boundary on the right edge
    path += ` L ${width - paddingRight} ${
      height -
      paddingBottom -
      ((sortedRanges[sortedRanges.length - 1].min - minValue) / valueRange) *
        graphHeight
    }`;

    // Add points for the bottom boundary (min values) from right to left
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

    // Close the path
    path += ` Z`;

    paths.push(path);
  }

  return paths;
}

function createVerticalGridLines(
  dataPoints: DataPoint[],
  minTime: number,
  maxTime: number,
  dimensions: ChartDimensions,
  formatDate: (date: Date) => string
) {
  const {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
  } = dimensions;
  const graphWidth = width - paddingLeft - paddingRight;

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
}

function createHorizontalGridLines(
  minValue: number,
  maxValue: number,
  dimensions: ChartDimensions,
  unit: string
) {
  const {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
  } = dimensions;
  const graphHeight = height - paddingTop - paddingBottom;

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
}

function createDataPoints(
  dataPoints: DataPoint[],
  minTime: number,
  maxTime: number,
  minValue: number,
  maxValue: number,
  dimensions: ChartDimensions,
  referenceRanges: DynamicReferenceRangePoint[]
) {
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

  // Sort reference ranges by timestamp
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

    // Find the appropriate reference range for this point's timestamp
    const getReferenceRangeForTimestamp = (
      timestamp: number
    ): { min: number; max: number } => {
      // If timestamp is before the first reference range, use the first one
      if (timestamp <= sortedReferenceRanges[0].timestamp) {
        return {
          min: sortedReferenceRanges[0].min,
          max: sortedReferenceRanges[0].max,
        };
      }

      // If timestamp is after the last reference range, use the last one
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

      // Find the two reference ranges that surround this timestamp and interpolate
      for (let i = 0; i < sortedReferenceRanges.length - 1; i++) {
        const currentRange = sortedReferenceRanges[i];
        const nextRange = sortedReferenceRanges[i + 1];

        if (
          timestamp >= currentRange.timestamp &&
          timestamp <= nextRange.timestamp
        ) {
          // Calculate how far along we are between the two reference points (0 to 1)
          const ratio =
            (timestamp - currentRange.timestamp) /
            (nextRange.timestamp - currentRange.timestamp);

          // Interpolate the min and max values
          const min =
            currentRange.min + ratio * (nextRange.min - currentRange.min);
          const max =
            currentRange.max + ratio * (nextRange.max - currentRange.max);

          return { min, max };
        }
      }

      // Fallback - shouldn't happen if the code is correct
      return {
        min: sortedReferenceRanges[0].min,
        max: sortedReferenceRanges[0].max,
      };
    };

    const refRange = getReferenceRangeForTimestamp(point.timestamp);
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
}
