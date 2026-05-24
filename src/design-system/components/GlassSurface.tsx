import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, glass, radii } from '../tokens';

interface Props {
  children?: React.ReactNode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  borderless?: boolean;
}

export function GlassSurface({
  children,
  intensity = glass.blur.thick,
  style,
  radius = radii.xl,
  borderless = false,
}: Props) {
  const containerStyle: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: borderless ? 0 : StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  };

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="systemUltraThinMaterialLight" style={[containerStyle, style]}>
        {children}
      </BlurView>
    );
  }

  // Android fallback — opaque white, no blur
  return (
    <View style={[containerStyle, { backgroundColor: glass.overlay.android }, style]}>
      {children}
    </View>
  );
}
