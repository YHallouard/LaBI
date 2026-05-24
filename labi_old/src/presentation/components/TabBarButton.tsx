import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface IconProps {
  [key: string]: (props: { color: string }) => React.JSX.Element;
}

function getIconComponent(
  routeName: string,
  props: { color: string }
): React.JSX.Element {
  const icons: IconProps = {
    Home: (props: { color: string }) => (
      <Ionicons name="home" size={20} {...props} />
    ),
    Upload: (props: { color: string }) => (
      <Ionicons name="add-circle" size={20} {...props} />
    ),
    Charts: (props: { color: string }) => (
      <Ionicons name="bar-chart" size={20} {...props} />
    ),
    default: (props: { color: string }) => (
      <Ionicons name="help-circle" size={20} {...props} />
    ),
  };

  const IconComponent = icons[routeName]
    ? icons[routeName](props)
    : icons["default"](props);

  return IconComponent;
}

export const TabBarButton = ({
  href,
  accessibilityState,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
}: {
  href: string | undefined;
  accessibilityState:
    | {
        selected: boolean;
      }
    | undefined;
  accessibilityLabel: string | undefined;
  testID: string | undefined;
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  color: string;
  label: string;
}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(
      typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
      { duration: 300 }
    );
  }, [scale, isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const iconTopPosition = interpolate(scale.value, [0, 1], [0, 9]);
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.3]);
    return {
      transform: [{ scale: scaleValue }],
      top: iconTopPosition,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return { opacity: opacity };
  });

  return (
    <PlatformPressable
      href={href}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      onLongPress={onLongPress}
      style={styles.tabBarItem}
    >
      <Animated.View style={animatedIconStyle}>
        {getIconComponent(routeName, { color: color })}
      </Animated.View>
      <Animated.Text
        style={[{ color: color }, styles.tabBarItemText, animatedTextStyle]}
      >
        {label}
      </Animated.Text>
    </PlatformPressable>
  );
};

const styles = StyleSheet.create({
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
  },
  tabBarItemText: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 2,
  },
});
