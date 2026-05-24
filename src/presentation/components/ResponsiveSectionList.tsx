import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  SectionList,
  Dimensions,
  ScaledSize,
  LayoutChangeEvent,
  SectionListData,
  SectionListRenderItem,
  StyleProp,
  ViewStyle,
  DimensionValue,
  RefreshControlProps,
} from "react-native";

type ResponsiveLayoutParams = {
  itemsPerRow: number;
  width: DimensionValue;
  marginHorizontal: number;
  showGrid: boolean;
  isLargeScreen: boolean;
};

export type { ResponsiveLayoutParams };

type ResponsiveSectionData<T> = {
  title: string;
  data: T[][];
} & SectionListData<T[]>;

type ResponsiveSectionListProps<T> = {
  sections: Array<{ title: string; data: T[] }>;
  renderItem: (
    item: T,
    index: number,
    isLargeScreen: boolean,
    layoutParams: ResponsiveLayoutParams
  ) => React.ReactElement;
  renderSectionHeader?: (title: string) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  maxColumns?: 2 | 3; // Maximum number of columns (2 for charts, 3 for analysis details)
  thresholds?: {
    twoColumns: number;
    threeColumns?: number;
  };
  onLayout?: (event: LayoutChangeEvent) => void;
  showsVerticalScrollIndicator?: boolean;
  stickySectionHeadersEnabled?: boolean;
  contentInsetAdjustmentBehavior?:
    | "automatic"
    | "scrollableAxes"
    | "never"
    | "always";
  ListHeaderComponent?:
    | React.ComponentType<unknown>
    | React.ReactElement
    | null;
};

export function ResponsiveSectionList<T>({
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
  contentContainerStyle,
  refreshControl,
  maxColumns = 2,
  thresholds = { twoColumns: 1000, threeColumns: 1400 },
  onLayout,
  showsVerticalScrollIndicator = true,
  stickySectionHeadersEnabled = true,
  contentInsetAdjustmentBehavior = "automatic",
  ListHeaderComponent,
}: ResponsiveSectionListProps<T>) {
  const [screenWidth, setScreenWidth] = useState<number>(
    Dimensions.get("window").width
  );
  const previousWidth = useRef<number>(Dimensions.get("window").width);

  // Robust dimension change detection
  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      const newWidth = window.width;
      if (Math.abs(newWidth - previousWidth.current) > 10) {
        previousWidth.current = newWidth;
        setScreenWidth(newWidth);
      }
    };

    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );

    const initialDimensions = Dimensions.get("window");
    previousWidth.current = initialDimensions.width;
    setScreenWidth(initialDimensions.width);

    return () => {
      subscription.remove();
    };
  }, []);

  // Backup layout listener for additional responsiveness
  const handleScreenLayoutChange = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && Math.abs(width - previousWidth.current) > 10) {
        previousWidth.current = width;
        setScreenWidth(width);
      }
      onLayout?.(event);
    },
    [onLayout]
  );

  // Calculate responsive layout parameters
  const layoutParams = useMemo((): ResponsiveLayoutParams => {
    if (maxColumns === 2) {
      // For 2-column layout (like ChartScreen)
      const canFitTwoColumns = screenWidth >= thresholds.twoColumns;
      return {
        itemsPerRow: canFitTwoColumns ? 2 : 1,
        width: canFitTwoColumns ? "48%" : "100%",
        marginHorizontal: canFitTwoColumns ? 12 : 0,
        showGrid: canFitTwoColumns,
        isLargeScreen: canFitTwoColumns,
      };
    } else {
      // For 3-column layout (like AnalysisDetailsScreen)
      if (screenWidth < thresholds.twoColumns) {
        return {
          itemsPerRow: 1,
          width: "100%",
          marginHorizontal: 0,
          showGrid: false,
          isLargeScreen: false,
        };
      } else if (screenWidth < (thresholds.threeColumns || 1400)) {
        return {
          itemsPerRow: 2,
          width: "48%",
          marginHorizontal: 12,
          showGrid: true,
          isLargeScreen: true,
        };
      } else {
        return {
          itemsPerRow: 3,
          width: "32%",
          marginHorizontal: 12,
          showGrid: true,
          isLargeScreen: true,
        };
      }
    }
  }, [screenWidth, maxColumns, thresholds]);

  // Group items into rows based on screen size
  const groupItemsIntoRows = useCallback(
    (items: T[]): T[][] => {
      const { itemsPerRow } = layoutParams;
      const rows: T[][] = [];

      for (let i = 0; i < items.length; i += itemsPerRow) {
        rows.push(items.slice(i, i + itemsPerRow));
      }

      return rows;
    },
    [layoutParams]
  );

  // Transform sections data into rows
  const responsiveSections = useMemo((): ResponsiveSectionData<T>[] => {
    return sections.map((section) => ({
      title: section.title,
      data: groupItemsIntoRows(section.data),
    }));
  }, [sections, groupItemsIntoRows]);

  // Render a row of items
  const renderSectionItem: SectionListRenderItem<T[]> = useCallback(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    ({ item: row, index: rowIndex }) => {
      const { showGrid } = layoutParams;

      return (
        <View
          style={{
            flexDirection: "row",
            justifyContent: showGrid ? "space-between" : "center",
            marginBottom: 16,
            paddingHorizontal: showGrid ? 8 : 8,
          }}
        >
          {row.map((item, itemIndex) => (
            <View
              key={keyExtractor(item, itemIndex)}
              style={{
                width: layoutParams.width,
                maxWidth: showGrid ? undefined : 800,
              }}
            >
              {renderItem(
                item,
                itemIndex,
                layoutParams.isLargeScreen,
                layoutParams
              )}
            </View>
          ))}
        </View>
      );
    },
    [layoutParams, renderItem, keyExtractor]
  );

  // Key extractor for rows
  const rowKeyExtractor = useCallback(
    (row: T[], index: number) =>
      `row-${index}-${row.map((item, i) => keyExtractor(item, i)).join("-")}`,
    [keyExtractor]
  );

  // Wrapper for section header to match SectionList expectations
  const sectionHeaderWrapper = useCallback(
    ({ section }: { section: SectionListData<T[]> }) => {
      const sectionWithTitle = section as SectionListData<T[]> & {
        title: string;
      };
      return renderSectionHeader
        ? renderSectionHeader(sectionWithTitle.title)
        : null;
    },
    [renderSectionHeader]
  );

  return (
    <View
      style={{ flex: 1 }}
      onLayout={handleScreenLayoutChange}
      testID="responsive-section-list-wrapper"
    >
      <SectionList
        sections={responsiveSections}
        renderSectionHeader={sectionHeaderWrapper}
        initialNumToRender={layoutParams.isLargeScreen ? 10 : 3}
        renderItem={renderSectionItem}
        keyExtractor={rowKeyExtractor}
        contentContainerStyle={contentContainerStyle}
        key={layoutParams.isLargeScreen ? "large" : "small"}
        contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        stickySectionHeadersEnabled={stickySectionHeadersEnabled}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={() => <View style={{ height: 90 }} />}
      />
    </View>
  );
}
