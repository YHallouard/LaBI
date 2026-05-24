import React from "react";
import { StyleProp, ViewStyle, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { glass } from "../../../config/themes";

interface GlassSurfaceProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: "light" | "dark" | "systemThinMaterial" | "systemChromeMaterial";
  radius?: number;
  style?: StyleProp<ViewStyle>;
  overlayColor?: string;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  intensity = glass.blur.regular,
  tint = "light",
  radius = glass.radii.md,
  style,
  overlayColor = glass.overlay.light,
}) => (
  <BlurView
    intensity={intensity}
    tint={tint}
    style={[styles.blur, { borderRadius: radius }, style]}
  >
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: overlayColor, borderRadius: radius },
      ]}
    />
    {children}
  </BlurView>
);

const styles = StyleSheet.create({
  blur: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glass.border,
  },
});
