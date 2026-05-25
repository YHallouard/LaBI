import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, elevation } from '../tokens';
import { typography } from '../typography';

interface Props {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

export function ListSection({ title, children, right }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={[typography.label, styles.title]}>{title}</Text>
        {right && <View style={styles.right}>{right}</View>}
      </View>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
  },
  title: {
    flex: 1,
  },
  right: {
    flexShrink: 0,
  },
  group: {
    marginHorizontal: spacing[4],
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...elevation[1],
  },
});
