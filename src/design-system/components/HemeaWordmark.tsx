import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../tokens';

interface Props {
  size?: number;
  color?: string;
}

export function HemeaWordmark({ size = 22, color = colors.textStrong }: Props) {
  const dropSize = Math.round(size * 0.9);
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { fontSize: size, lineHeight: size, color }]}>Héméa</Text>
      <Svg width={dropSize} height={dropSize} viewBox="0 0 24 24" style={styles.drop}>
        <Defs>
          <LinearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.gradient.from} />
            <Stop offset="0.5" stopColor={colors.gradient.mid} />
            <Stop offset="1" stopColor={colors.gradient.to} />
          </LinearGradient>
        </Defs>
        <Path d="M12 2C9 5 6 9 6 13a6 6 0 0 0 12 0c0-4-3-8-6-11z" fill="url(#hg)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    fontWeight: '800',
    letterSpacing: -0.44,
  },
  drop: {
    marginLeft: -2,
  },
});
