import React from "react";
import { StyleProp, ViewStyle, StyleSheet } from "react-native";
import { GlassSurface } from "./GlassSurface";
import { glass } from "../../../config/themes";

interface GlassCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => (
  <GlassSurface
    intensity={glass.blur.thin}
    tint="light"
    radius={glass.radii.lg}
    overlayColor={glass.overlay.solid}
    style={[styles.card, style]}
  >
    {children}
  </GlassSurface>
);

const styles = StyleSheet.create({
  card: {
    shadowColor: glass.shadow.color,
    shadowOffset: glass.shadow.offset,
    shadowOpacity: glass.shadow.opacity,
    shadowRadius: glass.shadow.radius,
    elevation: glass.shadow.elevation,
  },
});
