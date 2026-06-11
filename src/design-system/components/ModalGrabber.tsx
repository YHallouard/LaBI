import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../tokens';

export function ModalGrabber() {
  const insets = useSafeAreaInsets();
  const topExtra = Platform.OS === 'android' ? insets.top : 0;
  return <View style={[styles.grabber, { marginTop: topExtra + spacing[2] }]} />;
}

const styles = StyleSheet.create({
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
});
