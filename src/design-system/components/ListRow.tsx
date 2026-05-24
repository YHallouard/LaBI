import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../tokens';
import { typography } from '../typography';

interface Props {
  icon?: string;
  title: string;
  detail?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
}

export function ListRow({ icon, title, detail, onPress, isLast = false, destructive = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.bgBlue : 'transparent' }]}
    >
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon as any} size={20} color={destructive ? colors.danger : colors.primary} />
        </View>
      ) : null}
      <Text style={[typography.body, destructive && { color: colors.danger }, styles.title]}>{title}</Text>
      <View style={styles.right}>
        {detail ? <Text style={[typography.small, styles.detail]}>{detail}</Text> : null}
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
      {!isLast && <View style={styles.divider} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
    position: 'relative',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  title: {
    flex: 1,
    color: colors.textStrong,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detail: {
    color: colors.textMuted,
  },
  divider: {
    position: 'absolute',
    left: 52,
    right: spacing[4],
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
