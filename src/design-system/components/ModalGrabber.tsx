import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';

export function ModalGrabber() {
  return <View style={styles.grabber} />;
}

const styles = StyleSheet.create({
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
});
