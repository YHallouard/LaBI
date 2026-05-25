import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens';

interface Props {
  name?: string;
  size?: number;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PersonAvatar({ name, size = 56 }: Props) {
  const initials = getInitials(name);
  const innerSize = size - 4; // 2px padding each side
  const fontSize = Math.round(size * 0.36);

  return (
    <LinearGradient
      colors={[colors.gradient.from, colors.gradient.mid, colors.gradient.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: 2,
          shadowColor: '#CE5283',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 14,
        },
      ]}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: colors.bgElevated,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize,
            fontWeight: '700',
            color: colors.textStrong,
            letterSpacing: fontSize * -0.02,
          }}
        >
          {initials}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
