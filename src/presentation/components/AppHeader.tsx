import React from "react";
import { StyleSheet, StyleProp, ViewStyle, View } from "react-native";
import {
  useAnimatedStyle,
  useDerivedValue,
  SharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { GlassSurface } from "./glass/GlassSurface";
import { glass } from "../../config/themes";

interface AppHeaderProps {
  logo?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  logo,
  title,
  right,
  style,
}) => {
  return (
    <GlassSurface
      intensity={glass.blur.chrome}
      tint="systemChromeMaterial"
      radius={0}
      overlayColor={glass.overlay.light}
      style={[StyleSheet.absoluteFill, style]}
    >
      {(logo || title || right) && (
        <View style={styles.row}>
          <View style={styles.side} />
          <View style={styles.center}>{logo ?? title}</View>
          <View style={styles.side}>{right}</View>
        </View>
      )}
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  side: {
    width: 60,
    alignItems: "flex-end",
  },
});

// Hook for scroll-aware header animation in HomeScreen
export function useScrollAwareHeader(
  scrollY: SharedValue<number>,
  threshold: number
) {
  const headerOpacity = useDerivedValue(() =>
    interpolate(
      scrollY.value,
      [threshold - 25, threshold + 15],
      [0, 1],
      Extrapolation.CLAMP
    )
  );

  const headerOpacityStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const headerVisible = useDerivedValue(() => headerOpacity.value > 0.01);

  const largeHeaderOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, threshold * 0.6, threshold],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return { headerOpacityStyle, largeHeaderOpacityStyle, headerVisible };
}
