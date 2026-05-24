import React from "react";
import { StyleProp, ViewStyle, StyleSheet, View } from "react-native";
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
  radius = glass.radii.md,
  style,
  overlayColor = glass.overlay.light,
}) => (
  <View style={[styles.container, { borderRadius: radius }, style]}>
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: overlayColor, borderRadius: radius },
      ]}
    />
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
});
