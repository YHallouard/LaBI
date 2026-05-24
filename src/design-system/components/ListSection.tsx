import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, elevation } from '../tokens';
import { typography } from '../typography';

interface Props {
  title: string;
  children: React.ReactNode;
}

export function ListSection({ title, children }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[typography.label, styles.title]}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 22,
  },
  title: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
  },
  group: {
    marginHorizontal: spacing[4],
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...elevation[1],
  },
});
