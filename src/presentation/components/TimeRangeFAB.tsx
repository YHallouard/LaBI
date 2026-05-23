import React, { useCallback } from "react";
import { Text, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette, glass } from "../../config/themes";

export type TimeRangeOption = "1y" | "3y" | "5y" | "Max";

interface TimeRangeFABProps {
  selectedTimeRange: TimeRangeOption;
  onSelectTimeRange: (range: TimeRangeOption) => void;
}

const TIME_RANGES: { label: TimeRangeOption; yOffset: number; delay: number }[] = [
  { label: "1y", yOffset: -60, delay: 0 },
  { label: "3y", yOffset: -120, delay: 40 },
  { label: "5y", yOffset: -180, delay: 80 },
  { label: "Max", yOffset: -240, delay: 120 },
];

const SPRING = { damping: 14, stiffness: 180 };

export const TimeRangeFAB: React.FC<TimeRangeFABProps> = ({
  selectedTimeRange,
  onSelectTimeRange,
}) => {
  const progress = useSharedValue(0);

  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(progress.value, [0, 1], [0, 45], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const setOpen = useCallback(
    (open: boolean, onComplete?: () => void) => {
      const toValue = open ? 1 : 0;
      progress.value = withSpring(toValue, SPRING, (finished) => {
        if (finished && onComplete) {
          onComplete();
        }
      });
    },
    [progress]
  );

  const handleMainPress = () => {
    setOpen(progress.value < 0.5);
  };

  const handleSelect = (range: TimeRangeOption) => {
    setOpen(false, () => {
      onSelectTimeRange(range);
    });
  };

  return (
    <View style={styles.container}>
      {TIME_RANGES.map(({ label, yOffset, delay }) => (
        <MenuItem
          key={label}
          label={label}
          isActive={selectedTimeRange === label}
          yOffset={yOffset}
          delay={delay}
          progress={progress}
          onPress={() => handleSelect(label)}
        />
      ))}

      <TouchableOpacity
        style={styles.mainButton}
        onPress={handleMainPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.85}
      >
        <Animated.View style={[styles.mainButtonInner, mainButtonStyle]} pointerEvents="none">
          <Ionicons name="time-outline" size={20} color={colorPalette.neutral.white} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

interface MenuItemProps {
  label: TimeRangeOption;
  isActive: boolean;
  yOffset: number;
  delay: number;
  progress: Animated.SharedValue<number>;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  isActive,
  yOffset,
  delay,
  progress,
  onPress,
}) => {
  const style = useAnimatedStyle(() => {
    const p = withDelay(delay, withSpring(progress.value, SPRING));
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(p, [0, 1], [0, yOffset], Extrapolation.CLAMP) },
        { scale: interpolate(p, [0, 1], [0.5, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.menuItem, style]}>
      <TouchableOpacity
        style={[styles.menuButton, isActive && styles.menuButtonActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.menuButtonText, isActive && styles.menuButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    backgroundColor: colorPalette.primary.main,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colorPalette.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  mainButtonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItem: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9,
  },
  menuButton: {
    backgroundColor: colorPalette.neutral.white,
    width: 50,
    height: 50,
    borderRadius: glass.radii.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
  },
  menuButtonActive: {
    backgroundColor: colorPalette.primary.main,
    borderColor: colorPalette.primary.main,
  },
  menuButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colorPalette.primary.main,
  },
  menuButtonTextActive: {
    color: colorPalette.neutral.white,
  },
});
