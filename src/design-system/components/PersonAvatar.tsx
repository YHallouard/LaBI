import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../tokens';
import { typography } from '../typography';

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
  const fontSize = Math.round(size * 0.38);

  return (
    <LinearGradient
      colors={[colors.bgBlue, colors.primaryTint]}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[typography.value, { fontSize, color: colors.primary }]}>{initials}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
