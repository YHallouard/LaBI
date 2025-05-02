import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type HemeaLogoProps = {
  size?: 'small' | 'medium' | 'large';
};

export const HemeaLogo: React.FC<HemeaLogoProps> = ({ 
  size = 'medium'
}) => {
  const fontSize = getLogoFontSize(size);
  const dropSize = getDropIconSize(size);

  return (
    <View style={styles.container}>
      <Text style={[styles.logoText, { fontSize }]}>Héméa</Text>
      <Ionicons 
        name="water" 
        size={dropSize} 
        color="#e63757" 
        style={styles.dropIcon}
        testID="water-icon"
      />
    </View>
  );
};

const getLogoFontSize = (size: 'small' | 'medium' | 'large'): number => {
  const fontSizeMap = {
    small: 18,
    medium: 22,
    large: 28
  };
  return fontSizeMap[size];
};

const getDropIconSize = (size: 'small' | 'medium' | 'large'): number => {
  const dropSizeMap = {
    small: 16,
    medium: 20,
    large: 26
  };
  return dropSizeMap[size];
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    color: '#12263f',
  },
  dropIcon: {
    marginLeft: -4,
  }
});
