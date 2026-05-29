import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { colors, glass, radii } from '../tokens';

interface Props {
  children?: React.ReactNode;
  /** @deprecated No effect when expo-glass-effect Liquid Glass API is available */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  borderless?: boolean;
  borderColor?: string;
}

export function GlassSurface({
  children,
  intensity = glass.blur.thick,
  style,
  radius = radii.xl,
  borderless = false,
  borderColor = colors.glassBorder,
}: Props) {
  const containerStyle: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: borderless ? 0 : StyleSheet.hairlineWidth,
    borderColor,
  };

  if (Platform.OS === 'ios') {
    if (isGlassEffectAPIAvailable()) {
      return (
        <GlassView
          glassEffectStyle="regular"
          colorScheme="light"
          style={[containerStyle, style]}
        >
          {/* Design spec: inset 0 1px 0 rgba(255,255,255,0.7) top highlight */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
            }}
          />
          {children}
        </GlassView>
      );
    }

    // Older iOS without Liquid Glass API — fall back to BlurView
    return (
      <BlurView
        intensity={intensity}
        tint="systemUltraThinMaterialLight"
        style={[containerStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android — opaque white, no blur
  return (
    <View style={[containerStyle, { backgroundColor: glass.overlay.android }, style]}>
      {children}
    </View>
  );
}
