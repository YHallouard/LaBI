import React, { useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colorPalette, glass } from "../../config/themes";

export type TimeRangeOption = "1y" | "3y" | "5y" | "Max";

const RANGES: TimeRangeOption[] = ["1y", "3y", "5y", "Max"];
const SPRING = { damping: 100, stiffness: 400 };
const INNER_PADDING = 4;

interface TimeRangeSegmentedPillProps {
  selectedTimeRange: TimeRangeOption;
  onSelectTimeRange: (range: TimeRangeOption) => void;
  style?: StyleProp<ViewStyle>;
}

export const TimeRangeSegmentedPill: React.FC<TimeRangeSegmentedPillProps> = ({
  selectedTimeRange,
  onSelectTimeRange,
  style,
}) => {
  const [segmentWidth, setSegmentWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const selectedIndex = RANGES.indexOf(selectedTimeRange);

  useEffect(() => {
    if (segmentWidth > 0) {
      indicatorX.value = withSpring(
        INNER_PADDING + selectedIndex * segmentWidth,
        SPRING
      );
    }
  }, [selectedIndex, segmentWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const innerWidth = e.nativeEvent.layout.width - INNER_PADDING * 2;
    const newSegmentWidth = innerWidth / RANGES.length;
    if (Math.abs(newSegmentWidth - segmentWidth) > 0.5) {
      setSegmentWidth(newSegmentWidth);
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: glass.radii.pill,
          },
        ]}
      >
        <View style={styles.row} onLayout={handleLayout}>
          {segmentWidth > 0 && (
            <Animated.View
              style={[
                styles.indicator,
                { width: segmentWidth },
                indicatorStyle,
              ]}
            />
          )}
          {RANGES.map((range) => {
            const isSelected = range === selectedTimeRange;
            return (
              <TouchableOpacity
                key={range}
                style={styles.segment}
                onPress={() => onSelectTimeRange(range)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[styles.label, isSelected && styles.labelSelected]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  pill: {
    width: "100%",
    maxWidth: 360,
    shadowColor: glass.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    padding: INNER_PADDING,
    height: 40,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: INNER_PADDING,
    bottom: INNER_PADDING,
    left: 0,
    backgroundColor: colorPalette.primary.main,
    borderRadius: glass.radii.pill,
  },
  segment: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colorPalette.primary.main,
  },
  labelSelected: {
    color: colorPalette.neutral.white,
  },
});
