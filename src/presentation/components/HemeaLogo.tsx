import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colorPalette } from '../../config/themes';

export type HemeaLogoSize = 'small' | 'medium' | 'large';
export interface HemeaLogoProps {
  size?: HemeaLogoSize;
}

const getLogoFontSize = (size: HemeaLogoSize): number => {
  switch (size) {
    case 'small': return 24;
    case 'large': return 36;
    case 'medium':
    default: return 30;
  }
};

const getDropIconSize = (size: HemeaLogoSize): number => {
  switch (size) {
    case 'small': return 16;
    case 'large': return 30;
    case 'medium':
    default: return 24;
  }
};

export const HemeaLogo: React.FC<HemeaLogoProps> = ({ 
  size = 'medium'
}) => {
  const fontSize = getLogoFontSize(size);
  const dropSize = getDropIconSize(size);

  return (
    <View style={styles.container}>
      <Text style={[styles.logoText, { fontSize }]}>Héméa</Text>
      <View style={styles.dropIcon}>
        <Svg width={dropSize} height={dropSize} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id="dropGradient" x1="100%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={colorPalette.gradient.red} />
              <Stop offset="30%" stopColor={colorPalette.gradient.redPurple} />
              <Stop offset="100%" stopColor={colorPalette.gradient.purpleLight} />
            </LinearGradient>
          </Defs>
          <Path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
            fill="url(#dropGradient)"
            strokeWidth="0"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    color: colorPalette.neutral.main,
    fontFamily: 'Inter',
  },
  dropIcon: {
    marginLeft: -4,
  }
});
