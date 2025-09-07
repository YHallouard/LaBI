import React, { useState } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../config/themes";

export type TimeRangeOption = "1y" | "3y" | "5y" | "Max";

interface TimeRangeFABProps {
  selectedTimeRange: TimeRangeOption;
  onSelectTimeRange: (range: TimeRangeOption) => void;
}

export const TimeRangeFAB: React.FC<TimeRangeFABProps> = ({
  selectedTimeRange,
  onSelectTimeRange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animations = {
    rotation: useState(new Animated.Value(0))[0],
    menuItem1: useState(new Animated.Value(0))[0],
    menuItem2: useState(new Animated.Value(0))[0],
    menuItem3: useState(new Animated.Value(0))[0],
    menuItem4: useState(new Animated.Value(0))[0],
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    animateMenuToggle(toValue);
    setIsMenuOpen(!isMenuOpen);
  };

  const animateMenuToggle = (toValue: number) => {
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
    ]).start();
  };

  const selectTimeRange = (range: TimeRangeOption) => {
    const toValue = 0;

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
      setIsMenuOpen(false);
      onSelectTimeRange(range);
    });
  };

  const rotate = animations.rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const renderTimeRangeButton = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    animation: Animated.Value,
    yOffset: number
  ) => (
    <Animated.View
      style={[
        styles.menuItem,
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
      <PlatformPressable
        style={[styles.menuButton, isActive && styles.menuButtonActive]}
        onPress={onPress}
        pressColor={colorPalette.primary.light}
      >
        <Text
          style={[
            styles.menuButtonText,
            isActive && styles.menuButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </PlatformPressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {renderTimeRangeButton(
        "1y",
        selectedTimeRange === "1y",
        () => selectTimeRange("1y"),
        animations.menuItem4,
        -60
      )}
      {renderTimeRangeButton(
        "3y",
        selectedTimeRange === "3y",
        () => selectTimeRange("3y"),
        animations.menuItem3,
        -120
      )}
      {renderTimeRangeButton(
        "5y",
        selectedTimeRange === "5y",
        () => selectTimeRange("5y"),
        animations.menuItem2,
        -180
      )}
      {renderTimeRangeButton(
        "Max",
        selectedTimeRange === "Max",
        () => selectTimeRange("Max"),
        animations.menuItem1,
        -240
      )}

      <PlatformPressable
        style={styles.mainButton}
        onPress={toggleMenu}
        pressColor={colorPalette.primary.dark}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.View
          style={{
            transform: [{ rotate }],
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
          pointerEvents="none"
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={colorPalette.neutral.white}
          />
        </Animated.View>
      </PlatformPressable>
    </View>
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  menuItem: {
    position: "absolute",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9,
  },
  menuButton: {
    backgroundColor: colorPalette.neutral.white,
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
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
  },
  menuButtonActive: {
    backgroundColor: colorPalette.primary.main,
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
