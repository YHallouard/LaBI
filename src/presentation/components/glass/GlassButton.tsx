import React from "react";
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Text,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { glass, colorPalette } from "../../../config/themes";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassButtonProps {
  onPress?: () => void;
  icon?: React.ReactNode;
  label?: string;
  variant?: "solid" | "glass";
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  onPress,
  icon,
  label,
  variant = "glass",
  style,
  labelStyle,
  disabled,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 80 });
    opacity.value = withTiming(0.8, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animStyle, styles.base, variant === "solid" && styles.solid, style]}
    >
      {icon}
      {label && (
        <Text
          style={[
            styles.label,
            variant === "solid" && styles.labelSolid,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: glass.radii.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 6,
  },
  solid: {
    backgroundColor: colorPalette.primary.main,
    shadowColor: colorPalette.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colorPalette.neutral.main,
  },
  labelSolid: {
    color: colorPalette.neutral.white,
  },
});
