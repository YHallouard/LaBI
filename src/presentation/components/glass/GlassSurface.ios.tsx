import React from "react";
import { StyleProp, ViewStyle, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { glass } from "../../../config/themes";

interface GlassSurfaceProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: "light" | "dark" | "systemThinMaterial" | "systemChromeMaterial";
  radius?: number;
  style?: StyleProp<ViewStyle>;
  overlayColor?: string;
}

const USE_NATIVE_GLASS = isGlassEffectAPIAvailable();

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  intensity = glass.blur.regular,
  tint = "systemThinMaterial",
  radius = glass.radii.md,
  style,
  overlayColor = glass.overlay.light,
}) => {
  if (USE_NATIVE_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        style={[styles.glass, { borderRadius: radius }, style]}
      >
        {children}
      </GlassView>
    );
  }

  return (
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
};

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",
  },
  blur: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glass.border,
  },
});
