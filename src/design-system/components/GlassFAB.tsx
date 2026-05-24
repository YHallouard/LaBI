import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { elevation, radii } from '../tokens';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function GlassFAB({ children, onPress, size = 44, style, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.75 : 1 }, style]}
    >
      <GlassSurface radius={radii.pill} style={[styles.surface, { width: size, height: size }]}>
        {children}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    ...elevation[3],
  },
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
